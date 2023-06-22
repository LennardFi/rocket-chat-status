import * as vscode from "vscode"

export const internalErrorUserInfoMsg = "Internal error in Rocket.Chat Status extension"

export async function error(msg: string, args: unknown[], userInfoMsg?: string): Promise<void> {
    console.error(`Rocket.Chat Status error:\n${msg}\nArgs:`, args)

    if (userInfoMsg !== undefined) {
        await vscode.window.showErrorMessage(userInfoMsg)
    }
}

export async function warn(msg: string, args: unknown[], userInfoMsg?: string): Promise<void> {
    console.warn(`Rocket.Chat Status warning:\n${msg}\nArgs:`, args)

    if (userInfoMsg !== undefined) {
        await vscode.window.showWarningMessage(userInfoMsg)
    }
}
