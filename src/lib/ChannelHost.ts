import * as vscode from "vscode"
import { buildError } from "./tools"

export default class ChannelHost<T> implements vscode.Disposable {
    private currentValue: T
    private nextSubscriberId = 0
    private numberOfSubscriber = 0
    private onApprove: RCS.Channel.ApproveFunction<T>
    private onReject?: RCS.Channel.RejectFunction<T>
    private subscribers: Record<number, RCS.Channel.SubscriberStorage<T>> = {}

    constructor(
        initialValue: T,
        onApprove?: RCS.Channel.ApproveFunction<T>,
        onReject?: RCS.Channel.RejectFunction<T>
    ) {
        this.currentValue = initialValue
        this.onApprove = onApprove ?? (async (x) => x.next)
        this.onReject = onReject
    }

    private async propose(nextValue: T, subscriberId?: number): Promise<T> {
        if (subscriberId !== undefined && !(subscriberId in this.subscribers)) {
            throw buildError(
                "internal",
                "InvalidSubscriberId",
                `Subscriber id "${subscriberId}" not in ChannelHost found.`
            )
        }
        const prevValue = this.currentValue
        if (nextValue === prevValue) {
            return nextValue
        }
        try {
            await this.onApprove({
                cause: subscriberId === undefined ? "provider" : "subscriber",
                next: nextValue,
                prev: this.currentValue,
            })
            Object.keys(this.subscribers).forEach((key) => {
                const subId = Number.parseInt(key)
                const storage = this.subscribers[subId]
                const cause: RCS.Channel.HandlerEventCause =
                    subscriberId === undefined
                        ? "provider"
                        : subscriberId === subId
                        ? "me"
                        : "subscriber"
                try {
                    storage.changeHandler?.({
                        cause,
                        next: nextValue,
                        prev: prevValue,
                    })
                } catch (error: unknown) {
                    return
                }
            })
            return nextValue
        } catch (err: unknown) {
            await this.onReject?.({
                cause: subscriberId === undefined ? "provider" : "subscriber",
                next: nextValue,
                prev: prevValue,
            })
            Object.keys(this.subscribers).forEach((key) => {
                const subId = Number.parseInt(key)
                const storage = this.subscribers[subId]
                const cause: RCS.Channel.HandlerEventCause =
                    subscriberId === undefined
                        ? "provider"
                        : subscriberId === subId
                        ? "me"
                        : "subscriber"
                try {
                    storage.rejectHandler?.({
                        cause,
                        rejectedValue: nextValue,
                        prev: prevValue,
                    })
                } catch (error: unknown) {
                    return
                }
            })
            throw err
        }
    }

    private revoke(subscriberId: number, causedByProvider: boolean) {
        const next = { ...this.subscribers }
        const storage = next[subscriberId]
        storage.revokeHandler?.({
            causedByProvider,
            lastValue: this.currentValue,
        })
        this.numberOfSubscriber--
        delete next[subscriberId]
    }

    createChannel(
        onChangeHandler?: RCS.Channel.ChangeHandler<T>,
        onRejectHandler?: RCS.Channel.RejectHandler<T>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<T>
    ): RCS.Channel.Channel<T> {
        const newSubscriberStorage: RCS.Channel.SubscriberStorage<T> = {
            changeHandler: onChangeHandler,
            revokeHandler: onRevokeHandler,
            rejectHandler: onRejectHandler,
        }

        const subscriberId = this.nextSubscriberId
        this.nextSubscriberId++
        this.numberOfSubscriber++

        this.subscribers[subscriberId] = newSubscriberStorage

        return {
            propose: (newValue) => this.propose(newValue, subscriberId),
            read: () => this.currentValue,
            dispose: () => this.revoke(subscriberId, false),
        }
    }

    /**
     * Revokes the connection to all subscribers.
     */
    dispose(): void {
        Object.keys(this.subscribers).forEach((key) => {
            const subId = Number.parseInt(key)
            this.revoke(subId, true)
        })
    }

    getNumberOfSubscriber(): number {
        return this.numberOfSubscriber
    }

    update(value: T): void {
        void this.propose(value)
    }

    value(): T {
        return this.currentValue
    }
}
