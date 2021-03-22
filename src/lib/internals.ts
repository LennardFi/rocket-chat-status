import * as vscode from "vscode"
import { Maybe, RocketChatStatus } from ".."
import * as tools from "./tools"

const configSection = "rocket-chat-status"

const authTokenField = "authToken"
const userIdField = "userId"

export async function deleteAuthOptions(ctx: vscode.ExtensionContext): Promise<void> {
    await ctx.secrets.delete(authTokenField)
    await ctx.secrets.delete(userIdField)
}

export async function getAuthOptions(ctx: vscode.ExtensionContext): Promise<Maybe<RocketChatStatus.AuthOptions>> {
    const authToken = await ctx.secrets.get(authTokenField)
    const userId = await ctx.secrets.get(userIdField)

    if (authToken === undefined || userId === undefined) {
        return undefined
    }
    return {
        authToken: authToken,
        userId: userId,
    }
}

export async function setAuthOptions(ctx: vscode.ExtensionContext, authOptions: RocketChatStatus.AuthOptions): Promise<void> {
    await ctx.secrets.store(authTokenField, authOptions.authToken)
    await ctx.secrets.store(userIdField, authOptions.userId)
}

const apiUrlField = "apiUrl"

export async function getApiUrl(): Promise<Maybe<string>> {
    return vscode.workspace
        .getConfiguration(configSection)
        .get<string>(apiUrlField)
}

export async function setApiUrl(apiUrl: string): Promise<void> {
    return await vscode.workspace
        .getConfiguration(configSection)
        .update(apiUrlField, apiUrl, true)
}

const statusHistoryLimitField = "statusHistoryLimit"

export async function getStatusHistoryLimit(): Promise<number> {
    const cacheLimit =
        vscode.workspace
            .getConfiguration(configSection)
            .get<number>(statusHistoryLimitField)
    if (cacheLimit === undefined) {
        throw new Error("No value for status cache limit found.")
    }
    return cacheLimit
}

export async function setStatusHistoryLimit(cacheLimit: number): Promise<void> {
    return await vscode.workspace
        .getConfiguration(configSection)
        .update(statusHistoryLimitField, cacheLimit, true)
}

const currentStatusField = "status"

export async function getCurrentStatus(ctx: vscode.ExtensionContext): Promise<Maybe<RocketChatStatus.Status>> {
    return ctx.globalState.get<RocketChatStatus.Status>(currentStatusField)
}

export async function setCurrentStatus(ctx: vscode.ExtensionContext, status: Maybe<RocketChatStatus.Status>): Promise<void> {
    const current = await getCurrentStatus(ctx)

    if (current) {
        await addToStatusHistory(ctx, current)
    }

    await ctx.globalState.update(currentStatusField, status)
    await updateStatusBarLabel(ctx)
}

const statusHistoryField = "statusHistory"

export async function addToStatusHistory(ctx: vscode.ExtensionContext, status: RocketChatStatus.Status): Promise<void> {
    const cache = await getStatusHistory(ctx)
    const bookmarked = await getBookmarkedStatuses()
    const cacheLimit = await getStatusHistoryLimit()
    const nextHistory =
        [status, ...cache
            .filter(s =>
                (s.message !== status.message || s.online !== status.online) &&
                !bookmarked.some(bookmarkedStatus =>
                    bookmarkedStatus.message === s.message && bookmarkedStatus.online === s.online))]
            .slice(0, cacheLimit)
    return await ctx.globalState.update(statusHistoryField, nextHistory)
}

export async function deleteStatusHistory(ctx: vscode.ExtensionContext): Promise<void> {
    return await ctx.globalState.update(statusHistoryField, [])
}

export async function removeFromStatusHistory(ctx: vscode.ExtensionContext, status: RocketChatStatus.Status): Promise<void> {
    const cache = await getStatusHistory(ctx)
    const cacheLimit = await getStatusHistoryLimit()
    const nextHistory =
        cache
            .filter(s => (s.message !== status.message || s.online !== status.online))
            .slice(0, cacheLimit)
    return await ctx.globalState.update(statusHistoryField, nextHistory)
}

export async function getStatusHistory(ctx: vscode.ExtensionContext): Promise<RocketChatStatus.Status[]> {
    return [...(ctx.globalState.get<RocketChatStatus.Status[]>(statusHistoryField) ?? [])]
}

const bookmarkedStatusesField = "bookmarkedStatuses"

export async function addBookmarkedStatus(status: RocketChatStatus.Status): Promise<void> {
    const prev = await getBookmarkedStatuses()
    const next =
        prev.some(s => s.message === status.message && s.online === status.online) ?
            [...prev] :
            [...prev, status]
    return await vscode.workspace
        .getConfiguration(configSection)
        .update(bookmarkedStatusesField, next, true)
}

export async function deleteBookmarkedStatus(status: RocketChatStatus.Status): Promise<void> {
    const prev = await getBookmarkedStatuses()
    const next = prev.filter(s => !(
        s.message === status.message &&
        s.online === status.online
    ))
    return await vscode.workspace
        .getConfiguration(configSection)
        .update(bookmarkedStatusesField, next, true)
}

export async function getBookmarkedStatuses(): Promise<RocketChatStatus.Status[]> {
    return vscode.workspace
        .getConfiguration(configSection)
        .get<RocketChatStatus.Status[]>(bookmarkedStatusesField) ?? []
}

export const onlineStatusLabels: Record<RocketChatStatus.OnlineStatus, string> = {
    away: "Away",
    busy: "Busy",
    offline: "Offline",
    online: "Online",
}


export async function showStatusSelectionInput(options: RocketChatStatus.StatusSelectionInputOption<true>): Promise<Maybe<RocketChatStatus.Status | "new">>
export async function showStatusSelectionInput(options: RocketChatStatus.StatusSelectionInputOption<false>): Promise<Maybe<RocketChatStatus.Status>>
export async function showStatusSelectionInput(options: RocketChatStatus.StatusSelectionInputOption<boolean>): Promise<Maybe<RocketChatStatus.Status | "new">> {
    const list: RocketChatStatus.StatusQuickPickItem<RocketChatStatus.Status | "new">[] = []

    if (options.create) {
        list.push({
            label: options.icons ? "$(add) Create new status" : "Create new status",
            value: "new",
        })
    }

    if (options.history) {
        const cache = await getStatusHistory(options.context)

        cache.forEach(cachedStatus => {
            const onlineLabel = onlineStatusLabels[cachedStatus.online]
            list.push({
                description: cachedStatus.message,
                label: options.icons ? `$(history) ${onlineLabel}` : onlineLabel,
                value: cachedStatus,
            })
        })
    }

    if (options.bookmarked) {
        const bookmarked = await getBookmarkedStatuses()

        bookmarked.forEach(bookmarkedStatus => {
            const onlineLabel = onlineStatusLabels[bookmarkedStatus.online]
            list.push({
                description: bookmarkedStatus.message,
                label: options.icons ? `$(bookmark) ${onlineLabel}` : onlineLabel,
                value: bookmarkedStatus,
            })
        })
    }

    const selected =
        await vscode.window
            .showQuickPick<RocketChatStatus.StatusQuickPickItem<RocketChatStatus.Status | "new">>(list)

    if (selected === undefined) {
        return undefined
    }

    if (selected.value === "new") {
        return "new"
    }

    return {
        message: selected.value.message,
        online: selected.value.online,
    }
}

export async function showOnlineStatusPicker(ctx: vscode.ExtensionContext): Promise<Maybe<RocketChatStatus.OnlineStatus>> {
    const current = (await getCurrentStatus(ctx))?.online

    const selected =
        await vscode.window.showQuickPick<RocketChatStatus.StatusQuickPickItem<RocketChatStatus.OnlineStatus>>(
            (["online", "away", "busy", "offline"] as RocketChatStatus.OnlineStatus[])
                .map(onlineStatus => ({
                    label: onlineStatusLabels[onlineStatus],
                    picked: current === onlineStatus,
                    value: onlineStatus,
                })), {
            placeHolder: "New online status",
        })

    return selected?.value
}

export async function showMessagePicker(ctx: vscode.ExtensionContext): Promise<Maybe<string>> {
    const currentStatus = await getCurrentStatus(ctx)

    const selectedMessage = await vscode.window.showInputBox({
        prompt: "New status message",
        value: currentStatus?.message,
    })

    return selectedMessage
}

export const statusBarItem: vscode.StatusBarItem =
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3)

export async function updateStatusBarLabel(ctx: vscode.ExtensionContext): Promise<void> {
    const currentStatus = await getCurrentStatus(ctx)
    if (currentStatus) {
        statusBarItem.command = tools.buildCommand("setStatus")
        statusBarItem.text = `$(rocket) [${onlineStatusLabels[currentStatus.online]}] ${currentStatus.message}`
        statusBarItem.show()
        return
    }
    statusBarItem.hide()
}

export async function showNotConfiguredError(): Promise<void> {
    const result =
        await vscode.window
            .showErrorMessage("Rocket.Chat API URL hasn't been configured.", "Configure")

    if (result === "Configure") {
        await vscode.commands.executeCommand(tools.buildCommand("setup"))
    }
}

export async function showNoCurrentStateError(): Promise<void> {
    await vscode.window.showErrorMessage("Could not access current status.")
}

export async function showNotLoggedInError(): Promise<void> {
    const result =
        await vscode.window
            .showErrorMessage("Not logged in.", "Login")

    if (result === "Login") {
        await vscode.commands.executeCommand(tools.buildCommand("login"))
    }
}
