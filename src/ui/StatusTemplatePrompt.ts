import * as vscode from "vscode"
import { buildError } from "../lib/tools"

export default class StatusTemplatePrompt implements vscode.Disposable {
    private templateSelectionPrompt: vscode.QuickPick<vscode.QuickPickItem>

    constructor() {
        // TODO: Not implemented!
        throw buildError("internal", "NotImplemented", undefined, true)
    }

    dispose(): void {
        this.templateSelectionPrompt.dispose()
    }
}
