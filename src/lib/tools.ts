import { URL } from "url"

/**
 * @deprecated
 */
export function buildCommand(cmd: RCS.Base.Command): string {
    return `rocket-chat-status.${cmd}`
}

/**
 * @deprecated
 */
export function validateHost(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch (err: unknown) {
        return false
    }
}

export function statusToString(status: RCS.Base.Status): string {
    if (!status.connected) {
        return `❌`
    }
    return `[${status.availability}] ${status.message}`
}

export function buildError(
    scope: RCS.Error.ExceptionScope,
    code?: RCS.Error.ErrorCode,
    msg?: string,
    showOutputChannel?: boolean
): RCS.Error.Exception {
    const _showOutputChannel = showOutputChannel ?? scope === "internal"

    return {
        code,
        msg: msg ?? code,
        scope,
        type: "RocketChatStatusException",
        showOutputChannel: _showOutputChannel,
    }
}
