import * as vscode from "vscode"
import { Maybe, RocketChatStatus } from ".."

interface ConfigEntry<T> {
    get(): Promise<Maybe<T>>
    set(value: T): Promise<void>
}

export function buildAuthOptionsConfigEntry(ctx: vscode.ExtensionContext): ConfigEntry<RocketChatStatus.AuthOptions> {
    return {
        get: (async () => undefined),
        set: (async () => undefined),
    }
}
