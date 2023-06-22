import * as vscode from "vscode"
import StatusCreationPrompt from "./StatusCreationPrompt"
import StatusTemplatePrompt from "./StatusTemplatePrompt"

interface StatusPromptOptions {
    /**
     * The current status
     */
    currentStatus: RCS.Base.StoredStatus
    /**
     * A list of the last used statuses. Use an empty list to prevent history
     * entries from being displayed.
     */
    history: RCS.Base.StoredStatus[]
    /**
     * A list of configured templates. Use an empty list to prevent template
     * entries from being displayed.
     */
    templates: RCS.Templates.Template[]
    /**
     * @default true
     */
    allowCreateNew?: boolean
    /**
     * If the UI should stay open even when loosing UI focus. Defaults to false.
     * This setting is ignored on iPad and is always false.
     * @default false
     */
    ignoreFocusOut?: boolean
    /**
     * Uses the given title as the title of the prompt.
     * @default "Select a status"
     */
    title?: string
}

type OpenedMenuState = "create" | "template"

const MAIN_MENU_CREATE_LABEL = "Create new status"
const MAIN_MENU_TEMPLATES_LABEL = "Templates"

const defaultOptions: StatusPromptOptions = {
    currentStatus: {
        availability: "online",
        message: "",
    },
    history: [],
    templates: [],
    allowCreateNew: true,
    ignoreFocusOut: false,
    title: "Select a status",
}

export default class StatusPrompt implements vscode.Disposable {
    private mainMenu: vscode.QuickPick<vscode.QuickPickItem>
    private statusCreationPrompt: Maybe<StatusCreationPrompt>
    private statusTemplatePrompt: Maybe<StatusTemplatePrompt>
    private options: StatusPromptOptions
    private openedMenu?: OpenedMenuState
    private isRendering = false
    private showBackButton = false
    private onSubmit: Maybe<(status: Maybe<RCS.Base.StoredStatus>) => unknown>

    constructor(options: StatusPromptOptions) {
        this.options = {
            currentStatus: options?.currentStatus,
            history: options.history ?? defaultOptions.history,
            templates: options?.templates ?? defaultOptions.templates,
            allowCreateNew:
                options?.allowCreateNew ?? defaultOptions.allowCreateNew,
            ignoreFocusOut:
                options?.ignoreFocusOut ?? defaultOptions.ignoreFocusOut,
            title: options?.title ?? defaultOptions.title,
        }

        this.mainMenu = vscode.window.createQuickPick()
        this.statusCreationPrompt = new StatusCreationPrompt({
            ignoreFocusOut: options?.ignoreFocusOut,
            updateStatus: this.options.currentStatus,
        })
        this.statusTemplatePrompt = new StatusTemplatePrompt()
    }

    private render() {
        this.mainMenu.hide()

        this.mainMenu.title = this.options.title
        this.mainMenu.items = [
            {
                label: MAIN_MENU_CREATE_LABEL,
                alwaysShow: true,
            },
            ...((this.options.templates.length !== 0
                ? [
                      {
                          label: MAIN_MENU_TEMPLATES_LABEL,
                          alwaysShow: true,
                      },
                  ]
                : []) as vscode.QuickPickItem[]),
            ...((this.options.history.length !== 0
                ? [
                      {
                          kind: vscode.QuickPickItemKind.Separator,
                      },
                      ...this.options.history.map(
                          (status): vscode.QuickPickItem => {
                              return {
                                  label: status.availability,
                                  description: `$(history) ${status.message}`,
                              }
                          }
                      ),
                  ]
                : []) as vscode.QuickPickItem[]),
        ]

        this.statusCreationPrompt?.setCurrentStatus(this.options.currentStatus)

        this.mainMenu.step = 1
        this.mainMenu.totalSteps = 3

        if (this.openedMenu === undefined) {
            this.mainMenu.show()
        }
    }

    setStatusHistory(statusHistory: RCS.Base.StoredStatus[]): void {
        this.options.history = statusHistory
        return
    }

    setTemplates(statusTemplates: RCS.Templates.Template[]): void {
        this.options.templates = statusTemplates
        return
    }

    async open(
        showBackButton?: boolean
    ): Promise<Maybe<RCS.Base.StoredStatus>> {
        this.showBackButton = showBackButton ?? false
        return new Promise((resolve) => {
            this.onSubmit = (status) => {
                this.dispose()
                resolve(status)
            }
            this.render()
        })
    }

    dispose(): void {
        this.statusCreationPrompt?.dispose()
    }
}
