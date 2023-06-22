import * as vscode from "vscode"
import StatusPrompt from "./StatusPrompt"

interface MainMenuOptions {
    currentStatus: RCS.Base.Status
    statusHistory: RCS.Base.StoredStatus[]
    statusTemplates: RCS.Templates.Template[]
}

export default class MainMenu implements vscode.Disposable {
    private statusPrompt: StatusPrompt
    private options: MainMenuOptions

    constructor(options: MainMenuOptions) {
        this.options = options
        this.statusPrompt = new StatusPrompt({
            allowCreateNew: true,
            currentStatus: this.options.currentStatus,
            history: this.options.statusHistory,
            ignoreFocusOut: true,
            templates: this.options.statusTemplates,
        })
    }

    dispose(): void {
        return
    }
}
