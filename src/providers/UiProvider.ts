import { buildError, statusToString } from "../lib/tools"
import MainMenu from "../ui/MainMenu"
import OutputChannel from "../ui/OutputChannel"
import { ApiProvider } from "./ApiProvider"
import { Provider } from "./Provider"

export class UiProvider extends Provider {
    private outputChannel: OutputChannel

    private statusConnection?: RCS.Channel.Channel<RCS.Base.Status>
    private statusHistoryConnection?: RCS.Channel.Channel<
        RCS.Base.StoredStatus[]
    >
    private templatesConnection?: RCS.Channel.Channel<RCS.Templates.Template[]>

    /**
     *
     */
    constructor() {
        super()
        this.outputChannel = new OutputChannel()
    }

    async addProviderDependency(provider: ApiProvider): Promise<void> {
        this.statusConnection = provider.status(
            (e) => {
                if (e.cause === "provider") {
                    this.outputChannel.log(
                        `New status: ${statusToString(e.next)}`,
                        "debug",
                        false
                    )
                }
            },
            (e) => {
                if (e.cause === "me") {
                    // TODO: Implement reject handler (forward rejection to
                    // prompt class instance)
                }
            },
            (e) => {
                if (e.causedByProvider) {
                    this.outputChannel.logException({
                        scope: "internal",
                        showOutputChannel: true,
                        type: "RocketChatStatusException",
                        code: "ChannelHostConnectionLost",
                        msg: "Lost connection to StateProvider. Please create a GitHub Issue to report the extension author about this bug.",
                    })
                }
            }
        )
        return
    }

    onOpenMenu(): void {
        if (this.statusConnection === undefined) {
            this.outputChannel.logException(
                buildError("internal", "ChannelHostConnectionLost")
            )
            return
        }
        if (this.statusHistoryConnection === undefined) {
            this.outputChannel.logException(
                buildError("internal", "ChannelHostConnectionLost")
            )
            return
        }
        if (this.templatesConnection === undefined) {
            this.outputChannel.logException(
                buildError("internal", "ChannelHostConnectionLost")
            )
            return
        }
        const menu = new MainMenu({
            currentStatus: this.statusConnection.read(),
            statusHistory: this.statusHistoryConnection.read(),
            statusTemplates: this.templatesConnection.read(),
        })

        menu.dispose()
    }

    dispose(): void {
        this.statusConnection?.dispose()
    }
}
