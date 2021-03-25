import * as vscode from "vscode"
import { Maybe, RCSNext } from ".."

const authTokenField = "authToken"
const userIdField = "userId"

export async function getAuthOptions(ctx: vscode.ExtensionContext): Promise<Maybe<RCSNext.Base.AuthOptions>> {
    const authToken = await ctx.secrets.get(authTokenField)
    const userId = await ctx.secrets.get(userIdField)

    if (authToken === undefined || userId === undefined) {
        return undefined
    }

    return {
        authToken: authToken,
        userId: userId,
    }
}

export async function setAuthToken(ctx: vscode.ExtensionContext, authOptions?: RCSNext.Base.AuthOptions): Promise<void> {
    if (authOptions === undefined) {
        await ctx.secrets.delete(authTokenField)
        await ctx.secrets.delete(userIdField)
        return
    }

    await ctx.secrets.store(authTokenField, authOptions.authToken)
    await ctx.secrets.store(userIdField, authOptions.userId)
    return
}
