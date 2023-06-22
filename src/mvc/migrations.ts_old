import * as vscode from "vscode"
import { RocketChatStatus } from "."
import { setupField } from "./data/setup"

const versionField = "version"

export const RCS_CURRENT_VERSION: RocketChatStatus.Base.Version = "1.0.0"

const migrateLegacy: RocketChatStatus.Internals.MigrationHandler =
    async ctx => {
        try {
            const authToken = await ctx.secrets.get("authToken")
            const userId = await ctx.secrets.get("userId")
            const baseUrl = vscode.workspace
                .getConfiguration("rocket-chat-status")
                .get<string>("apiUrl")

            if (
                typeof authToken === "string" &&
                typeof userId === "string" &&
                typeof baseUrl === "string"
            ) {
                await ctx.secrets.store(setupField, JSON.stringify({
                    authToken: authToken,
                    baseUrl: baseUrl,
                    userId: userId,
                } as RocketChatStatus.Base.Setup))
                return "1.0.0"
            }
            return undefined
        } catch (err: unknown) {
            return undefined
        }
    }

export const migrateExtensionData = async (ctx: vscode.ExtensionContext): Promise<void> => {
    let version = ctx.globalState.get<RocketChatStatus.Base.Version>(versionField)

    if (version === RCS_CURRENT_VERSION) {
        return
    }

    if (version === undefined) {
        version = await migrateLegacy(ctx)
    }
}
