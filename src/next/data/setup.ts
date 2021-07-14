import * as vscode from "vscode"
import { Maybe, RocketChatStatus } from ".."
import { error, internalErrorUserInfoMsg, warn } from "../ui/error"

export const setupField = "setup"

export async function deleteSetup(ctx: vscode.ExtensionContext): Promise<void> {
    await ctx.secrets.delete(setupField)
}

export async function getSetup(ctx: vscode.ExtensionContext, errorOnUndefined?: boolean): Promise<Maybe<RocketChatStatus.Base.Setup>> {
    const rawSetup = await ctx.secrets.get(setupField)

    if (rawSetup === undefined) {
        if (errorOnUndefined) {
            await error("Extension not set up", [rawSetup], "Extension not set up.")
        }
        return
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

        await warn("Invalid stored setup value", [rawSetup], internalErrorUserInfoMsg)
    } catch (err: unknown) {
        await error("Could not parse JSON of stored setup", [rawSetup], internalErrorUserInfoMsg)
    }

}

export async function setSetup(ctx: vscode.ExtensionContext, setup: RocketChatStatus.Base.Setup): Promise<void> {
    await ctx.secrets.store(setupField, JSON.stringify(setup))
}
