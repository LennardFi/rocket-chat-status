import * as vscode from "vscode"
import { RocketChatStatus } from ".."

const statusHistoryLimitField = "statusHistoryLimit"

export async function deleteHistory(ctx: vscode.ExtensionContext): Promise<void> {
    await ctx.globalState.update(statusHistoryLimitField, undefined)
}

export async function getHistory(ctx: vscode.ExtensionContext): Promise<RocketChatStatus.Base.StoredStatus[]> {
    const history = ctx.globalState
        .get<RocketChatStatus.Base.StoredStatus[]>(statusHistoryLimitField)

    if (history === undefined) {
        return []
    }

    return history
}

export async function setHistory(ctx: vscode.ExtensionContext, history: RocketChatStatus.Base.StoredStatus[]): Promise<void> {
    await ctx.globalState.update(statusHistoryLimitField, history)
}
