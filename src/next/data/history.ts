import * as vscode from "vscode"
import { RCSNext } from ".."

const statusHistoryLimitField = "statusHistoryLimit"

export async function deleteHistory(ctx: vscode.ExtensionContext): Promise<void> {
    await ctx.globalState.update(statusHistoryLimitField, undefined)
}

export async function getHistory(ctx: vscode.ExtensionContext): Promise<RCSNext.Base.StoredStatus[]> {
    const history = ctx.globalState
        .get<RCSNext.Base.StoredStatus[]>(statusHistoryLimitField)

    if (history === undefined) {
        return []
    }

    return history
}

export async function setHistory(ctx: vscode.ExtensionContext, history: RCSNext.Base.StoredStatus[]): Promise<void> {
    await ctx.globalState.update(statusHistoryLimitField, history)
}
