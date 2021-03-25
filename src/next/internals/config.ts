import * as vscode from "vscode"
import { RCSNext } from ".."

const configSection = "rocket-chat-status"

const bookmarkedStatusesField = "bookmarkedStatuses"

export async function getBookedStatuses(): Promise<RCSNext.Base.Status[]> {
    const statuses =
        vscode.workspace
            .getConfiguration(configSection)
            .get<RCSNext.Base.Status[]>(bookmarkedStatusesField)

    if (statuses === undefined) {
        return []
    }

    return statuses
}

export async function updateBookedStatuses(updater: (prev: RCSNext.Base.Status[]) => RCSNext.Base.Status[]): Promise<void> {
    const prev = await getBookedStatuses()
    await vscode.workspace
        .getConfiguration(configSection)
        .update(bookmarkedStatusesField, updater(prev), true)
}
