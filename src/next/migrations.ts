import * as vscode from "vscode"
import { RCSNext } from "."
import { setupField } from "./data/setup"

const versionField = "version"

async function migrateLegacy(ctx: vscode.ExtensionContext): Promise<RCSNext.Base.Version> {
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
            } as RCSNext.Base.Setup))
            return "0.2.0"
        }
        return undefined
    } catch (err: unknown) {
        return undefined
    }
}

export default async function migration(ctx: vscode.ExtensionContext): Promise<boolean> {
    try {
        const currentVersion = ctx.globalState.get<RCSNext.Base.Version>(versionField)

        let migratedVersion = currentVersion

        switch (migratedVersion) {
            case undefined:
                migratedVersion = await migrateLegacy(ctx)
                break
            default:
                if (currentVersion !== migratedVersion) {
                    await ctx.globalState.update(versionField, migratedVersion)
                }
                return true
        }

        return false
    } catch (err: unknown) {
        return false
    }
}
