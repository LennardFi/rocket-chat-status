import { URL } from "url"
import { RocketChatStatus } from ".."

export function buildCommand(cmd: RocketChatStatus.Command): string {
    return `rocket-chat-status.${cmd}`
}

export function validateHost(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch (err: unknown) {
        return false
    }
}
