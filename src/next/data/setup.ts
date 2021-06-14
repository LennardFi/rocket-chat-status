import * as vscode from "vscode"
import { Maybe, RocketChatStatus } from ".."

export const setupField = "setup"

export async function deleteSetup(ctx: vscode.ExtensionContext): Promise<void> {
    await ctx.secrets.delete(setupField)
}

export async function getSetup(ctx: vscode.ExtensionContext): Promise<Maybe<RocketChatStatus.Base.Setup>> {
    const rawSetup = await ctx.secrets.get(setupField)

    if (rawSetup === undefined) {
        return undefined
    }

    try {
        const parsed = JSON.parse(rawSetup) as unknown

        if (typeof parsed === "object" &&
            parsed !== null &&
            "authToken" in parsed &&
            "baseUrl" in parsed &&
            "userId" in parsed
        ) {
            return parsed as RocketChatStatus.Base.Setup
        }

        return undefined
    } catch (err: unknown) {
        return undefined
    }

}

export async function setSetup(ctx: vscode.ExtensionContext, setup: RocketChatStatus.Base.Setup): Promise<void> {
    await ctx.secrets.store(setupField, JSON.stringify(setup))
}
