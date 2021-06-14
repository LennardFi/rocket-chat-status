import * as vscode from "vscode"
import { Maybe, RocketChatStatus } from ".."
import * as tools from "./tools"

/**
 * @deprecated
 */
const configSection = "rocket-chat-status"

/**
 * @deprecated
 */
const authTokenField = "authToken"
/**
 * @deprecated
 */
const userIdField = "userId"

/**
 * @deprecated
 */
export async function deleteAuthOptions(ctx: vscode.ExtensionContext): Promise<void> {
    await ctx.secrets.delete(authTokenField)
    await ctx.secrets.delete(userIdField)
}

/**
 * @deprecated
 */
export async function getAuthOptions(ctx: vscode.ExtensionContext): Promise<Maybe<RocketChatStatus.AuthOptions>> {
    try {
        const authToken = await ctx.secrets.get(authTokenField)
        const userId = await ctx.secrets.get(userIdField)

        if (authToken === undefined || userId === undefined) {
            return undefined
        }

        return {
            authToken: authToken,
            userId: userId,
        }
    } catch (err: unknown) {
        return undefined
    }
}

/**
 * @deprecated
 */
export async function setAuthOptions(ctx: vscode.ExtensionContext, authOptions: RocketChatStatus.AuthOptions): Promise<void> {
    await ctx.secrets.store(authTokenField, authOptions.authToken)
    await ctx.secrets.store(userIdField, authOptions.userId)
}

/**
 * @deprecated
 */
const apiUrlField = "apiUrl"

/**
 * @deprecated
 */
export async function getApiUrl(): Promise<Maybe<string>> {
    return vscode.workspace
        .getConfiguration(configSection)
        .get<string>(apiUrlField)
}

/**
 * @deprecated
 */
export async function setApiUrl(apiUrl: string): Promise<void> {
    return await vscode.workspace
        .getConfiguration(configSection)
        .update(apiUrlField, apiUrl, true)
}

/**
 * @deprecated
 */
const onlineStatusLabelField = "onlineStatusLabel"

/**
 * @deprecated
 */
export async function getOnlineStatusLabelConfig(): Promise<RocketChatStatus.OnlineStatusLabelConfig> {
    const onlineStatusLabelConfig =
        vscode.workspace
            .getConfiguration(configSection)
            .get<RocketChatStatus.OnlineStatusLabelConfig>(onlineStatusLabelField)
    if (onlineStatusLabelConfig === undefined) {
        throw new Error("No value for status label config found.")
    }
    return onlineStatusLabelConfig
}

/**
 * @deprecated
 */
const statusHistoryLimitField = "statusHistoryLimit"

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export async function initStatusBarItem(ctx: vscode.ExtensionContext): Promise<void> {
    vscode.workspace.onDidChangeConfiguration(async e => {
        if (e.affectsConfiguration(configSection)) {
            await updateStatusBarLabel(ctx)
        }
    })
}

/**
 * @deprecated
 */
const currentStatusField = "status"

/**
 * @deprecated
 */
export async function getCurrentStatus(ctx: vscode.ExtensionContext): Promise<Maybe<RocketChatStatus.Status>> {
    return ctx.globalState.get<RocketChatStatus.Status>(currentStatusField)
}

/**
 * @deprecated
 */
export async function setCurrentStatus(ctx: vscode.ExtensionContext, status: Maybe<RocketChatStatus.Status>): Promise<void> {
    const current = await getCurrentStatus(ctx)

    if (current) {
        await addToStatusHistory(ctx, current)
    }

    await ctx.globalState.update(currentStatusField, status)
    await updateStatusBarLabel(ctx)
}

/**
 * @deprecated
 */
const statusHistoryField = "statusHistory"

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export async function deleteStatusHistory(ctx: vscode.ExtensionContext): Promise<void> {
    return await ctx.globalState.update(statusHistoryField, [])
}

/**
 * @deprecated
 */
export async function removeFromStatusHistory(ctx: vscode.ExtensionContext, status: RocketChatStatus.Status): Promise<void> {
    const cache = await getStatusHistory(ctx)
    const cacheLimit = await getStatusHistoryLimit()
    const nextHistory =
        cache
            .filter(s => (s.message !== status.message || s.online !== status.online))
            .slice(0, cacheLimit)
    return await ctx.globalState.update(statusHistoryField, nextHistory)
}

/**
 * @deprecated
 */
export async function getStatusHistory(ctx: vscode.ExtensionContext): Promise<RocketChatStatus.Status[]> {
    return [...(ctx.globalState.get<RocketChatStatus.Status[]>(statusHistoryField) ?? [])]
}

/**
 * @deprecated
 */
const bookmarkedStatusesField = "bookmarkedStatuses"

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export async function getBookmarkedStatuses(): Promise<RocketChatStatus.Status[]> {
    return vscode.workspace
        .getConfiguration(configSection)
        .get<RocketChatStatus.Status[]>(bookmarkedStatusesField) ?? []
}

/**
 * @deprecated
 */
export const onlineStatusLabels: Record<RocketChatStatus.OnlineStatus, string> = {
    away: "Away",
    busy: "Busy",
    offline: "Offline",
    online: "Online",
}

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export async function updateStatusBarLabel(ctx: vscode.ExtensionContext): Promise<void> {
    const currentStatus = await getCurrentStatus(ctx)

    const labelConfig = await getOnlineStatusLabelConfig()

    if (labelConfig === "Label and color" || labelConfig === "Only color") {
        switch (currentStatus?.online) {
            case "away":
                statusBarItem.color = "#f3be08"
                break
            case "busy":
                statusBarItem.color = "#f5455c"
                break
            case "offline":
                statusBarItem.color = undefined
                break
            case "online":
                statusBarItem.color = "#2de0a5"
                break
        }
    } else {
        statusBarItem.color = undefined
    }

    if (currentStatus) {
        statusBarItem.command = tools.buildCommand("setStatus")

        if (labelConfig === "Only label" || labelConfig === "Label and color") {
            statusBarItem.text = `$(rocket) [${onlineStatusLabels[currentStatus.online]}] ${currentStatus.message}`
        } else {
            statusBarItem.text = `$(rocket) ${currentStatus.message}`
        }
        statusBarItem.show()
        return
    }
    statusBarItem.hide()
}

/**
 * @deprecated
 */
export async function showNotConfiguredError(): Promise<void> {
    const result =
        await vscode.window
            .showErrorMessage("Rocket.Chat API URL hasn't been configured.", "Configure")

    if (result === "Configure") {
        await vscode.commands.executeCommand(tools.buildCommand("setup"))
    }
}

/**
 * @deprecated
 */
export async function showNoCurrentStateError(): Promise<void> {
    await vscode.window.showErrorMessage("Could not access current status.")
}

/**
 * @deprecated
 */
export async function showNotLoggedInError(): Promise<void> {
    const result =
        await vscode.window
            .showErrorMessage("Not logged in.", "Login")

    if (result === "Login") {
        await vscode.commands.executeCommand(tools.buildCommand("login"))
    }
}
