import * as vscode from "vscode"
import { Maybe, RocketChatStatus } from ".."

export class RocketChatStatusProvider {
    public static readonly apiUrlConfigField = "apiUrl"
    public static readonly authTokenSecretsField = "authOptions"
    public static readonly userIdSecretsField = "authOptions"
    public static readonly configSection = "rocket-chat-status"

    protected extensionContext: vscode.ExtensionContext

    constructor(ctx: vscode.ExtensionContext) {
        this.extensionContext = ctx
        return
    }

    public async login(): Promise<void> {
        const apiUrl = await this.getApiUrl()
    }

    public async setup(apiUrl: string): Promise<void> {
        try {
            await vscode.workspace
                .getConfiguration(RocketChatStatusProvider.configSection)
                .update(RocketChatStatusProvider.apiUrlConfigField, apiUrl, true)
        } catch (err: unknown) {
            await this.showError("Could not set API URL", err)
        }
    }

    private async getApiUrl(): Promise<string> {
        try {
            const apiUrl = vscode.workspace
                .getConfiguration(RocketChatStatusProvider.configSection)
                .get<string>(RocketChatStatusProvider.apiUrlConfigField)
            return apiUrl
        } catch (err: unknown) {
            await this.showError("Could not get API URL", err)
            return undefined
        }
    }

    private async setApiUrl(apiUrl: string): Promise<void> {
        await vscode.workspace
            .getConfiguration(RocketChatStatusProvider.configSection)
            .update(RocketChatStatusProvider.apiUrlConfigField, apiUrl)
    }

    private async getAuthOptions(): Promise<Maybe<RocketChatStatus.AuthOptions>> {
        try {
            const authToken =
                await this.extensionContext.secrets
                    .get(RocketChatStatusProvider.authTokenSecretsField)

            const userId =
                await this.extensionContext.secrets
                    .get(RocketChatStatusProvider.userIdSecretsField)

            if (authToken === undefined || userId === undefined) {
                throw new Error("No authentication informations set.")
            }

            return {
                authToken: authToken,
                userId: userId,
            }
        } catch (err: unknown) {
            await this.showError("Could not get auth options", err)
            return
        }
    }

    protected async showError(msg: string, err: unknown): Promise<void> {
        console.error(msg + "\n", err)
        await vscode.window.showErrorMessage(msg)
    }
}
