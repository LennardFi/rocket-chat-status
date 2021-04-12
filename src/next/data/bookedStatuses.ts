import * as vscode from "vscode"
import { RCSNext } from ".."

const configSection = "rocket-chat-status"

const bookmarkedStatusesField = "bookmarkedStatuses"

export async function deleteBookedStatuses(): Promise<void> {
    await vscode.workspace
        .getConfiguration(configSection)
        .update(bookmarkedStatusesField, undefined, true)
}

export async function getBookedStatuses(): Promise<RCSNext.Base.StoredStatus[]> {
    const statuses =
        vscode.workspace
            .getConfiguration(configSection)
            .get<RCSNext.Base.StoredStatus[]>(bookmarkedStatusesField)

    if (statuses === undefined) {
        return []
    }

    return statuses
}

export async function setBookedStatuses(bookedStatuses: RCSNext.Base.StoredStatus[]): Promise<void> {
    await vscode.workspace
        .getConfiguration(configSection)
        .update(bookmarkedStatusesField, bookedStatuses, true)
}
