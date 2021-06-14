import { URL } from "url"
import { RocketChatStatus } from "../next"

/**
 * @deprecated
 */
export function buildCommand(cmd: RocketChatStatus.Base.Command): string {
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
