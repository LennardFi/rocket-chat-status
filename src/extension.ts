import * as vscode from "vscode"
import { ApiProvider } from "./providers/ApiProvider"
import { ConfigProvider } from "./providers/ConfigProvider"
import { UiProvider } from "./providers/UiProvider"
import StatusCreationPrompt from "./ui/StatusCreationPrompt"

export async function activate(/* ctx: vscode.ExtensionContext */): Promise<void> {
    // const configProvider = await ConfigProvider.create(ctx)
    // const apiProvider = new ApiProvider()
    // await apiProvider.addProviderDependency(configProvider)
    // const uiProvider = new UiProvider()
    // await uiProvider.addProviderDependency(apiProvider)

    vscode.commands.registerCommand(RCS_COMMAND_OPEN_MENU, () => {
        const statusCreationPrompt = new StatusCreationPrompt({
            ignoreFocusOut: true,
        })
        void statusCreationPrompt.open().then(status => console.log(JSON.stringify(status)))
        // uiProvider.onOpenMenu()
    })
}

export async function deactivate(): Promise<void> {
    return new Promise((resolve) => {
        return resolve()
    })
}
