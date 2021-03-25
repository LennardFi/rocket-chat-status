import * as vscode from "vscode"
import { RCSNext } from ".."

const statusHistoryLimitField = "statusHistoryLimit"

export function getHistory(ctx: vscode.ExtensionContext): RCSNext.Base.Status[] {
    const history = ctx.globalState
        .get<RCSNext.Base.Status[]>(statusHistoryLimitField)

    if (history === undefined) {
        return []
    }

    return history
}

export async function updateHistory(
    ctx: vscode.ExtensionContext,
    updater: (prev: RCSNext.Base.Status[]) => RCSNext.Base.Status[]
): Promise<void> {
    const prev = getHistory(ctx)
    await ctx.globalState.update(statusHistoryLimitField, updater(prev))
}
