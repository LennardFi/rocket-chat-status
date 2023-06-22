import * as vscode from "vscode"

interface StatusCreationPromptOptions {
    /**
     * If the UI should stay open even when loosing UI focus. Defaults to false.
     * This setting is ignored on iPad and is always false.
     * @default false
     */
    ignoreFocusOut?: boolean
    /**
     * Instead of specifying a new status the user can update the given one.
     */
    updateStatus?: Maybe<RCS.Base.StoredStatus>
}

const ONLINESTATUS_ONLINE_LABEL = "Online"
const ONLINESTATUS_AWAY_LABEL = "Away"
const ONLINESTATUS_BUSY_LABEL = "Busy"
const ONLINESTATUS_HIDDEN_LABEL = "Hidden"
const PROMPT_TITLE = "Create new status"

const defaultOptions: StatusCreationPromptOptions = {
    ignoreFocusOut: false,
    updateStatus: undefined,
}

/**
 * A class to build a pair of inputs to allow the user entering a new status.
 * The user starts by selecting the online status and then specifying the status
 * message.
 */
export default class StatusCreationPrompt implements vscode.Disposable {
    private onlineStatusPrompt: vscode.QuickPick<vscode.QuickPickItem>
    private statusMessagePrompt: vscode.InputBox
    private options: StatusCreationPromptOptions
    private selectedOnlineStatus?: RCS.Base.UserAvailability
    private selectedStatusMessage?: string
    private isRendering = false
    private showBackButton = false
    private onSubmit: Maybe<(status: Maybe<RCS.Base.StoredStatus>) => unknown>

    constructor(options?: Partial<StatusCreationPromptOptions>) {
        this.options = {
            ignoreFocusOut:
                options?.ignoreFocusOut ?? defaultOptions.ignoreFocusOut,
            updateStatus: options?.updateStatus ?? defaultOptions.updateStatus,
        }

        // Setup prompts
        this.onlineStatusPrompt = vscode.window.createQuickPick()
        this.statusMessagePrompt = vscode.window.createInputBox()
        if (this.options.ignoreFocusOut) {
            this.onlineStatusPrompt.ignoreFocusOut = true
            this.statusMessagePrompt.ignoreFocusOut = true
        }

        const statusMessageInputBackButton = vscode.QuickInputButtons.Back
        this.statusMessagePrompt.buttons = [statusMessageInputBackButton]
        this.statusMessagePrompt.onDidTriggerButton((e) => {
            if (e === statusMessageInputBackButton) {
                this.selectedOnlineStatus = undefined
                this.isRendering = true
                this.render()
            }
        })

        this.onlineStatusPrompt.onDidAccept(() => {
            const items = this.onlineStatusPrompt.selectedItems

            this.selectedOnlineStatus =
                items[0].label.toLowerCase() as RCS.Base.UserAvailability

            this.render()
        })
        this.statusMessagePrompt.onDidAccept(() => {
            this.selectedStatusMessage = this.statusMessagePrompt.value

            this.render()

            if (
                this.selectedOnlineStatus !== undefined &&
                this.selectedStatusMessage !== undefined
            ) {
                this.onSubmit?.({
                    availability: this.selectedOnlineStatus,
                    message: this.selectedStatusMessage,
                })
            }
        })
        this.onlineStatusPrompt.onDidHide(() => {
            if (!this.isRendering) {
                this.onSubmit?.(undefined)
                return
            }
        })
        this.statusMessagePrompt.onDidHide(() => {
            if (!this.isRendering) {
                this.onSubmit?.(undefined)
                return
            }
        })
    }

    private render() {
        this.onlineStatusPrompt.hide()
        this.statusMessagePrompt.hide()

        this.onlineStatusPrompt.title = PROMPT_TITLE
        this.onlineStatusPrompt.items = [
            { label: ONLINESTATUS_ONLINE_LABEL },
            { label: ONLINESTATUS_AWAY_LABEL },
            { label: ONLINESTATUS_BUSY_LABEL },
            { label: ONLINESTATUS_HIDDEN_LABEL },
        ]
        if (this.showBackButton) {
            this.onlineStatusPrompt.step = 2
            this.statusMessagePrompt.step = 3
            const backButton = vscode.QuickInputButtons.Back
            this.onlineStatusPrompt.buttons = [backButton]
            this.onlineStatusPrompt.onDidTriggerButton((e) => {
                if (e === backButton) {
                    this.onSubmit?.(undefined)
                }
            })
        }
        this.statusMessagePrompt.title = PROMPT_TITLE

        if (this.selectedOnlineStatus === undefined) {
            this.onlineStatusPrompt.show()
            return
        }

        if (this.selectedStatusMessage === undefined) {
            this.statusMessagePrompt.show()
        }
    }

    setCurrentStatus(status?: RCS.Base.StoredStatus): void {
        this.options.updateStatus = status
    }

    async open(
        showBackButton?: boolean
    ): Promise<Maybe<RCS.Base.StoredStatus>> {
        this.showBackButton = showBackButton ?? false

        if (this.options.updateStatus !== undefined) {
            this.onlineStatusPrompt.value =
                this.options.updateStatus.availability
            this.statusMessagePrompt.value = this.options.updateStatus.message
        }
        return new Promise((resolve) => {
            this.onSubmit = (status) => {
                this.dispose()
                resolve(status)
            }
            this.render()
        })
    }

    dispose(): void {
        this.onlineStatusPrompt.dispose()
        this.statusMessagePrompt.dispose()
    }
}
