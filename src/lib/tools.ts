import { URL } from "url"
import { RCSNext } from "../next"

export function buildCommand(cmd: RCSNext.Base.Command): string {
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
