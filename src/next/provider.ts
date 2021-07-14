import * as vscode from "vscode"
import { RocketChatStatus } from "."
import { buildCommand } from "../lib/tools"
import { login, logout } from "./api/session"
import { downloadStatus, uploadStatus } from "./api/status"
import { deleteBookedStatuses, getBookedStatuses, setBookedStatuses } from "./data/bookedStatuses"
import { deleteHistory, getHistory } from "./data/history"
import { deleteSetup, getSetup } from "./data/setup"
import { Maybe } from "./index"

export class RocketChatStatusProvider {
    public readonly context: vscode.ExtensionContext
    protected setup: Maybe<RocketChatStatus.Base.Setup> = undefined
    protected state: Maybe<RocketChatStatus.Base.State> = undefined
    protected statusBarLabel: vscode.StatusBarItem

    constructor(ctx: vscode.ExtensionContext) {
        this.context = ctx

        this.statusBarLabel =
            vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)

        ctx.subscriptions.push(this.statusBarLabel)

        void getSetup(this.context).then(async setup => {
            if (setup !== undefined) {
                this.setup = setup
                const bookmarked = await getBookedStatuses()
                const status = await downloadStatus(setup)
                const history = await getHistory(ctx)

                this.state = {
                    bookmarked: bookmarked,
                    history: history,
                    status: status
                }

                await this.updateLabel()
            }
        })
    }

    public async bookmarkCurrentStatus(): Promise<void> {
        try {
            if (this.state === undefined) {
                return await RocketChatStatusProvider.showNoStateError()
            }

            const bookedStatuses = await getBookedStatuses()

            const status = this.state.status

            if (bookedStatuses.some(s => s.message === status.message && s.online === status.online)) {
                return
            }
            await setBookedStatuses([...bookedStatuses, {
                message: status.message,
                online: status.online,
            }])
        } catch (err: unknown) {
            await RocketChatStatusProvider.showInternalError("Unknown error in \"bookmarkStatus\"", err)
        }
    }

    public async checkIsReady(error: boolean): Promise<boolean> {
        if (this.setup === undefined) {
            if (error) {
                await RocketChatStatusProvider.showNoSetupError()
            }
            return false
        }

        if (this.state === undefined) {
            if (error) {
                await RocketChatStatusProvider.showNoStateError()
            }
            return false
        }

        return true
    }

    public async deleteData(): Promise<void> {
        try {
            await deleteBookedStatuses()
            await deleteHistory(this.context)
            await deleteSetup(this.context)

            await RocketChatStatusProvider.showInternalError("Not implemented", "deleteData")
        } catch (err: unknown) {
            await RocketChatStatusProvider.showInternalError("Unknown error in \"deleteData\"", err)
        }
    }

    public async downloadStatus(): Promise<void> {
        try {
            if (this.setup === undefined) {
                return await RocketChatStatusProvider.showNoSetupError()
            }

            const status = await downloadStatus(this.setup)
            await this.updateStatus(async () => status)
        } catch (err: unknown) {
            await RocketChatStatusProvider.showInternalError("Unknown error in \"deleteData\"", err)
        }
    }

    public async getStatus(): Promise<Maybe<RocketChatStatus.Base.Status>> {
        try {
            if (this.setup === undefined) {
                await RocketChatStatusProvider.showNoSetupError()
                return
            }

            if (this.state === undefined) {
                await RocketChatStatusProvider.showNoStateError()
                return
            }

            return this.state.status
        } catch (err: unknown) {
            await RocketChatStatusProvider.showInternalError("Unknown error in \"getStatus\"", err)
            return
        }
    }

    public async login(apiUrl: string, username: string, password: string): Promise<void> {
        try {
            const setup = await login(apiUrl, username, password)

            if (setup !== undefined) {
                this.setup = setup
                return
            }
            await RocketChatStatusProvider.showNoSetupError()
        } catch (err: unknown) {
            await RocketChatStatusProvider.showInternalError("Could not set API URL", err)
        }
    }

    public async logout(): Promise<void> {
        try {
            if (this.setup !== undefined) {
                return await logout(this.setup)
            }
            await RocketChatStatusProvider.showNoSetupError()
        } catch (err: unknown) {
            await RocketChatStatusProvider.showInternalError("Could not logout", err)
        }
    }

    public async updateStatus(updater: (prev: RocketChatStatus.Base.Status) => Promise<RocketChatStatus.Base.Status>): Promise<void> {
        try {
            if (this.setup === undefined) {
                return await RocketChatStatusProvider.showNoSetupError()
            }
            if (this.state === undefined) {
                return await RocketChatStatusProvider.showNoStateError()
            }

            const prev = this.state.status

            if (prev.offline) {
                const continueAction = "Continue"

                const offlineResult = await vscode.window.showErrorMessage(
                    "Currently, no server URL has been configured. " +
                    "If you delete the authentication data now, " +
                    "it will not be invalidated on the server. " +
                    "This could allow someone to log into your account " +
                    "using these authentication credentials.",
                    continueAction
                )

                if (offlineResult !== continueAction) {
                    return
                }
            }

            const next = await updater(prev)

            await uploadStatus(this.setup, next)

            const status = await downloadStatus(this.setup)

            this.state = {
                ...this.state,
                history: this.state.history.reduce((prevHistory, s) => {
                    if (s.message === status.message && s.online === status.online) {
                        return prevHistory
                    }
                    return [...prevHistory, s]
                }, [status] as RocketChatStatus.Base.StoredStatus[])
            }
        } catch (err: unknown) {
            return await RocketChatStatusProvider.showInternalError("Unknown error in \"updateStatus\"", err)
        }
    }

    protected async updateLabel(): Promise<void> {
        if (this.setup === undefined) {
            this.statusBarLabel.color = undefined
            this.statusBarLabel.text = "$(rocket) Not configured"
            return
        }

        if (this.state === undefined) {
            this.statusBarLabel.color = undefined
            this.statusBarLabel.text = "$(rocket) No state"
            return
        }

        this.statusBarLabel.command = buildCommand("setStatus")

        const status = this.state.status

        if (typeof status === "object") {

            let color: Maybe<string> = undefined
            let label

            switch (status.online) {
                case "away":
                    color = "red"
                    label = "Online"
                    break
                case "busy":
                    color = "yellow"
                    label = "Busy"
                    break
                case "hidden":
                    color = undefined
                    label = "Hidden"
                    break
                case "online":
                    color = "green"
                    label = "Online"
                    break
            }

            this.statusBarLabel.color = color
            this.statusBarLabel.text = `$(rocket) [${label}] ${status.message}`
            return
        }

        this.statusBarLabel.color = undefined
        this.statusBarLabel.text = "$(rocket) [Offline]"
        return
    }

    static async showNoStateError(): Promise<void> {
        const loginAction = "Login"
        const result =
            await vscode.window
                .showErrorMessage("Rocket.Chat API URL hasn't been configured.", loginAction)

        if (result === loginAction) {
            await vscode.commands.executeCommand(buildCommand("login"))
        }
    }

    static async showNoSetupError(): Promise<void> {
        const loginAction = "Login"
        const result =
            await vscode.window
                .showErrorMessage("Rocket.Chat API URL hasn't been configured.", loginAction)

        if (result === loginAction) {
            await vscode.commands.executeCommand(buildCommand("login"))
        }
    }

    static async showInternalError(msg: string, err: unknown): Promise<void> {
        console.error(msg + "\n", err)
        await vscode.window.showErrorMessage(msg)
    }
}
