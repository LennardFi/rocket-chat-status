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
    } catch (e: unknown) {
        logMessage("Could not get API login secrets from storage.", {
            verbose: true,
        })
        throw e
    }
}

export async function setAuthOptions(ctx: vscode.ExtensionContext, authOptions: RocketChatStatus.AuthOptions): Promise<void> {
    try {
        await ctx.secrets.store(authTokenField, authOptions.authToken)
        await ctx.secrets.store(userIdField, authOptions.userId)
    } catch (e: unknown) {
        logMessage("Could not set API login secrets to storage.", {
            verbose: true,
        })
        throw e
    }
}

const apiUrlField = "apiUrl"

export async function getApiUrl(): Promise<Maybe<string>> {
    try {
        return vscode.workspace
            .getConfiguration(configSection)
            .get<string>(apiUrlField)
    } catch (e: unknown) {
        logMessage("Could not set API login secrets to storage.", {
            verbose: true,
        })
        throw e
    }
}

export async function setApiUrl(apiUrl: string): Promise<void> {
    try {
        return await vscode.workspace
            .getConfiguration(configSection)
            .update(apiUrlField, apiUrl, true)
    } catch (e: unknown) {
        logMessage("Could not update API URL in global configuration.", {
            verbose: true,
        })
        throw e
    }
}

const onlineStatusLabelField = "onlineStatusLabel"

export async function getOnlineStatusLabelConfig(): Promise<RocketChatStatus.OnlineStatusLabelConfig> {
    const onlineStatusLabelConfig =
        vscode.workspace
            .getConfiguration(configSection)
            .get<RocketChatStatus.OnlineStatusLabelConfig>(onlineStatusLabelField)
    if (onlineStatusLabelConfig === undefined) {
        return "Label and color"
    }
    return onlineStatusLabelConfig
}

const statusHistoryLimitField = "statusHistoryLimit"

export async function getStatusHistoryLimit(): Promise<number> {
    const cacheLimit =
        vscode.workspace
            .getConfiguration(configSection)
            .get<number>(statusHistoryLimitField)
    if (cacheLimit === undefined) {
        return 10
    }
    return cacheLimit
}

export async function initStatusBarItem(ctx: vscode.ExtensionContext): Promise<void> {
    vscode.workspace.onDidChangeConfiguration(async e => {
        if (e.affectsConfiguration(configSection)) {
            try {
                await updateStatusBarLabel(ctx)
            } catch (e: unknown) {
                logMessage("Could not initialize status bar item.", {
                    verbose: true,
                })
                throw e
            }
        }
    })
}

const currentStatusField = "status"

export async function getCurrentStatus(ctx: vscode.ExtensionContext): Promise<Maybe<RocketChatStatus.Status>> {
    return ctx.globalState.get<RocketChatStatus.Status>(currentStatusField)
}

export async function setCurrentStatus(ctx: vscode.ExtensionContext, status: Maybe<RocketChatStatus.Status>): Promise<void> {
    try {
        const current = await getCurrentStatus(ctx)

        if (current) {
            await addToStatusHistory(ctx, current)
        }

        await ctx.globalState.update(currentStatusField, status)
        await updateStatusBarLabel(ctx)
    } catch (e: unknown) {
        logMessage("Could store current status.", {
            verbose: true,
        })
        throw e
    }
}

const statusHistoryField = "statusHistory"

export async function addToStatusHistory(ctx: vscode.ExtensionContext, status: RocketChatStatus.Status): Promise<void> {
    try {
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
    } catch (e: unknown) {
        logMessage("Could not add status to status history.", {
            verbose: true,
        })
        throw e
    }
}

export async function deleteStatusHistory(ctx: vscode.ExtensionContext): Promise<void> {
    try {
        return await ctx.globalState.update(statusHistoryField, [])
    } catch (e: unknown) {
        logMessage("Could not delete status history.", {
            verbose: true,
        })
        throw e
    }
}

export async function removeFromStatusHistory(ctx: vscode.ExtensionContext, status: RocketChatStatus.Status): Promise<void> {
    try {
        const cache = await getStatusHistory(ctx)
        const cacheLimit = await getStatusHistoryLimit()
        const nextHistory =
            cache
                .filter(s => (s.message !== status.message || s.online !== status.online))
                .slice(0, cacheLimit)
        return await ctx.globalState.update(statusHistoryField, nextHistory)
    } catch (e: unknown) {
        logMessage("Could not remove status from status history.", {
            verbose: true,
        })
        throw e
    }
}

export async function getStatusHistory(ctx: vscode.ExtensionContext): Promise<RocketChatStatus.Status[]> {
    try {
        return [...(ctx.globalState.get<RocketChatStatus.Status[]>(statusHistoryField) ?? [])]
    } catch (e: unknown) {
        logMessage("Could not load status history.", {
            verbose: true,
        })
        throw e
    }
}

const bookmarkedStatusesField = "bookmarkedStatuses"

export async function addBookmarkedStatus(status: RocketChatStatus.Status): Promise<void> {
    try {
        const prev = await getBookmarkedStatuses()
        const next =
            prev.some(s => s.message === status.message && s.online === status.online) ?
                [...prev] :
                [...prev, status]
        return await vscode.workspace
            .getConfiguration(configSection)
            .update(bookmarkedStatusesField, next, true)
    } catch (e: unknown) {
        logMessage("Could not bookmark status.", {
            verbose: true,
        })
        throw e
    }
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

export const outputChannel: vscode.OutputChannel =
    vscode.window.createOutputChannel("Rocket.Chat Status")

export const statusBarItem: vscode.StatusBarItem =
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3)

export async function updateStatusBarLabel(ctx: vscode.ExtensionContext): Promise<void> {
    try {
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
    } catch (e: unknown) {
        logMessage("Could not update status bar label.", {
            verbose: true,
        })
        throw e
    }
}

export async function showNotConfiguredError(): Promise<void> {
    const result =
        await vscode.window
            .showErrorMessage("Rocket.Chat API URL hasn't been configured.", "Configure")

    if (result === "Configure") {
        await vscode.commands.executeCommand(tools.buildCommand("setup"))
    }
}

export async function showCouldNotAccessStatusError(errorDetails: unknown): Promise<void> {
    const msg = "Could not download current Rocket.Chat status."
    logMessage(`${msg}\nDetails: \t${String(errorDetails)}`)
    await vscode.window.showErrorMessage(msg)
}

export async function showNotLoggedInError(): Promise<void> {
    const result =
        await vscode.window
            .showErrorMessage("Not logged in.", "Login")

    logMessage("Not logged in.")

    if (result === "Login") {
        await vscode.commands.executeCommand(tools.buildCommand("login"))
    }
}

export function logMessage(msg: string, options?: RocketChatStatus.LogMessageOptions): void {
    outputChannel.appendLine(`${new Date().toISOString().replace("T", " ")}:\t${msg.split("\n").join("\n\t\t\t\t\t\t\t")}`)

    if (options?.showChannel) {
        outputChannel.show(true)
    }
}
