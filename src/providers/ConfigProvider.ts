import { URL } from "url"
import * as vscode from "vscode"
import ChannelHost from "../lib/ChannelHost"
import { buildError } from "../lib/tools"
import { Provider } from "./Provider"

const CONFIG_SECTION = "rocket-chat-status"
const APIURL_CONFIG_NAME = "apiUrl"
const BOOKMARKED_STATUSES_CONFIG_NAME = "bookmarkedStatuses"
const ONLINE_STATUS_LABEL_FORMAT_CONFIG_NAME = "onlineStatusLabelFormat"
const STATUS_HISTORY_LIMIT_CONFIG_NAME = "statusHistoryLimit"
const STATUS_MESSAGE_TEMPLATES_CONFIG_NAME = "statusMessageTemplates"
const AUTH_TOKEN_CONFIG_NAME = "authToken"
const USER_ID_CONFIG_NAME = "userId"

export class ConfigProvider extends Provider {
    private extensionContext: vscode.ExtensionContext
    private apiUrlChannel: ChannelHost<string>
    private apiUrlChanged = false
    private statusLabelFormatChannel: ChannelHost<string>
    private statusLabelFormatChanged = false
    private statusHistoryLimitChannel: ChannelHost<number>
    private statusHistoryLimitChanged = false
    private statusMessageTemplatesChannel: ChannelHost<string[]>
    private statusMessageTemplatesChanged = false
    private authTokenChannel: ChannelHost<string>
    private authTokenChanged = false
    private userIdChannel: ChannelHost<string>
    private userIdChanged = false

    constructor(
        ctx: vscode.ExtensionContext,
        apiUrl: string,
        onlineStatusLabelFormat: string,
        statusHistoryLimit: number,
        statusMessageTemplates: string[],
        authToken: string,
        userId: string
    ) {
        super()
        this.extensionContext = ctx

        this.apiUrlChannel = new ChannelHost<string>(apiUrl, async (e) => {
            // TODO: Add apiUrl check
            if (e.cause === "provider") {
                return e.next
            }
            try {
                new URL(e.next)
                this.apiUrlChanged = true
                await vscode.workspace
                    .getConfiguration(CONFIG_SECTION)
                    .update(APIURL_CONFIG_NAME, e.next)
                return e.next
            } catch {
                throw buildError(
                    "user",
                    "InvalidApiUrl",
                    `The configured API URL (${e.next}) is not a valid URL.`,
                    true
                )
            }
        })

        this.statusLabelFormatChannel = new ChannelHost<string>(
            onlineStatusLabelFormat,
            undefined, // TODO: Add approve function
            async (e) => {
                if (e.cause === "provider") {
                    return
                }
                this.statusHistoryLimitChanged = true
                return await vscode.workspace
                    .getConfiguration(CONFIG_SECTION)
                    .update(ONLINE_STATUS_LABEL_FORMAT_CONFIG_NAME, e.next)
            }
        )

        this.statusHistoryLimitChannel = new ChannelHost<number>(
            statusHistoryLimit,
            undefined,
            async (e) => {
                if (e.cause === "provider") {
                    return
                }
                this.statusHistoryLimitChanged = true
                return await vscode.workspace
                    .getConfiguration(CONFIG_SECTION)
                    .update(STATUS_HISTORY_LIMIT_CONFIG_NAME, e.next)
            }
        )

        this.statusMessageTemplatesChannel = new ChannelHost<string[]>(
            statusMessageTemplates,
            undefined,
            async (e) => {
                if (e.cause === "provider") {
                    return
                }
                this.statusMessageTemplatesChanged = true
                return await vscode.workspace
                    .getConfiguration(CONFIG_SECTION)
                    .update(STATUS_MESSAGE_TEMPLATES_CONFIG_NAME, e.next)
            }
        )

        this.authTokenChannel = new ChannelHost<string>(
            authToken,
            undefined,
            async (e) => {
                if (e.cause === "provider") {
                    return
                }
                this.authTokenChanged = true
                return await this.extensionContext.secrets.store(
                    AUTH_TOKEN_CONFIG_NAME,
                    e.next
                )
            }
        )

        this.userIdChannel = new ChannelHost<string>(
            userId,
            undefined,
            async (e) => {
                if (e.cause === "provider") {
                    return
                }
                this.userIdChanged = true
                return await this.extensionContext.secrets.store(
                    USER_ID_CONFIG_NAME,
                    e.next
                )
            }
        )

        vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (
                e.affectsConfiguration(
                    `${CONFIG_SECTION}.${APIURL_CONFIG_NAME}`
                )
            ) {
                if (this.apiUrlChanged) {
                    this.apiUrlChanged = false
                } else {
                    const apiUrl = vscode.workspace
                        .getConfiguration(CONFIG_SECTION)
                        .get<string>(APIURL_CONFIG_NAME, "")

                    this.apiUrlChannel.update(apiUrl)
                }
            }

            if (
                e.affectsConfiguration(
                    `${CONFIG_SECTION}.${ONLINE_STATUS_LABEL_FORMAT_CONFIG_NAME}`
                )
            ) {
                if (this.statusLabelFormatChanged) {
                    this.statusLabelFormatChanged = false
                } else {
                    const onlineStatusLabelFormat = vscode.workspace
                        .getConfiguration(CONFIG_SECTION)
                        .get<string>(
                            ONLINE_STATUS_LABEL_FORMAT_CONFIG_NAME,
                            RCS_STATUS_LABEL_FORMAT_DEFAULT_VALUE
                        )

                    this.statusLabelFormatChannel.update(
                        onlineStatusLabelFormat
                    )
                }
            }

            if (
                e.affectsConfiguration(
                    `${CONFIG_SECTION}.${STATUS_HISTORY_LIMIT_CONFIG_NAME}`
                )
            ) {
                if (this.statusHistoryLimitChanged) {
                    this.statusHistoryLimitChanged = false
                } else {
                    const statusHistoryLimit = vscode.workspace
                        .getConfiguration(CONFIG_SECTION)
                        .get<number>(
                            STATUS_HISTORY_LIMIT_CONFIG_NAME,
                            RCS_HISTORY_LIMIT_DEFAULT_VALUE
                        )

                    this.statusHistoryLimitChannel.update(statusHistoryLimit)
                }
            }

            if (
                e.affectsConfiguration(
                    `${CONFIG_SECTION}.${STATUS_MESSAGE_TEMPLATES_CONFIG_NAME}`
                )
            ) {
                if (this.statusMessageTemplatesChanged) {
                    this.statusMessageTemplatesChanged = false
                } else {
                    const statusMessageTemplates = vscode.workspace
                        .getConfiguration(CONFIG_SECTION)
                        .get<string[]>(STATUS_MESSAGE_TEMPLATES_CONFIG_NAME, [])

                    this.statusMessageTemplatesChannel.update(
                        statusMessageTemplates
                    )
                }
            }
        })

        ctx.secrets.onDidChange(async (e) => {
            if (e.key === USER_ID_CONFIG_NAME) {
                if (this.userIdChanged) {
                    this.userIdChanged = false
                } else {
                    const userId =
                        (await ctx.secrets.get(USER_ID_CONFIG_NAME)) ?? ""

                    this.userIdChannel.update(userId)
                }
            }

            if (e.key === AUTH_TOKEN_CONFIG_NAME) {
                if (this.authTokenChanged) {
                    this.authTokenChanged = false
                } else {
                    const authToken =
                        (await ctx.secrets.get(AUTH_TOKEN_CONFIG_NAME)) ?? ""

                    this.authTokenChannel.update(authToken)
                }
            }
        })
    }

    async addProviderDependency(): Promise<void> {
        return
    }

    apiUrl(
        onChangeHandler?: RCS.Channel.ChangeHandler<string>,
        onRejectHandler?: RCS.Channel.RejectHandler<string>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<string>
    ): RCS.Channel.Channel<string> {
        return this.apiUrlChannel.createChannel(
            onChangeHandler,
            onRejectHandler,
            onRevokeHandler
        )
    }

    statusLabelFormat(
        onChangeHandler?: RCS.Channel.ChangeHandler<string>,
        onRejectHandler?: RCS.Channel.RejectHandler<string>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<string>
    ): RCS.Channel.Channel<string> {
        return this.statusLabelFormatChannel.createChannel(
            onChangeHandler,
            onRejectHandler,
            onRevokeHandler
        )
    }

    statusHistoryLimit(
        onChangeHandler?: RCS.Channel.ChangeHandler<number>,
        onRejectHandler?: RCS.Channel.RejectHandler<number>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<number>
    ): RCS.Channel.Channel<number> {
        return this.statusHistoryLimitChannel.createChannel(
            onChangeHandler,
            onRejectHandler,
            onRevokeHandler
        )
    }

    statusMessageTemplates(
        onChangeHandler?: RCS.Channel.ChangeHandler<string[]>,
        onRejectHandler?: RCS.Channel.RejectHandler<string[]>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<string[]>
    ): RCS.Channel.Channel<string[]> {
        return this.statusMessageTemplatesChannel.createChannel(
            onChangeHandler,
            onRejectHandler,
            onRevokeHandler
        )
    }

    authToken(
        onChangeHandler?: RCS.Channel.ChangeHandler<string>,
        onRejectHandler?: RCS.Channel.RejectHandler<string>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<string>
    ): RCS.Channel.Channel<string> {
        return this.authTokenChannel.createChannel(
            onChangeHandler,
            onRejectHandler,
            onRevokeHandler
        )
    }

    userId(
        onChangeHandler?: RCS.Channel.ChangeHandler<string>,
        onRejectHandler?: RCS.Channel.RejectHandler<string>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<string>
    ): RCS.Channel.Channel<string> {
        return this.userIdChannel.createChannel(
            onChangeHandler,
            onRejectHandler,
            onRevokeHandler
        )
    }

    static async create(ctx: vscode.ExtensionContext): Promise<ConfigProvider> {
        try {
            const config = vscode.workspace.getConfiguration(CONFIG_SECTION)

            const apiUrl = config.get<string>(APIURL_CONFIG_NAME, "")
            const bookmarkedStatuses = config.get<RCS.Base.StoredStatus[]>(
                BOOKMARKED_STATUSES_CONFIG_NAME,
                []
            )
            const onlineStatusLabelFormat = config.get<string>(
                ONLINE_STATUS_LABEL_FORMAT_CONFIG_NAME,
                RCS_STATUS_LABEL_FORMAT_DEFAULT_VALUE
            )
            const statusHistoryLimit = config.get<number>(
                STATUS_HISTORY_LIMIT_CONFIG_NAME,
                RCS_HISTORY_LIMIT_DEFAULT_VALUE
            )
            const statusMessageTemplates = config.get<string[]>(
                STATUS_MESSAGE_TEMPLATES_CONFIG_NAME,
                []
            )
            const authToken =
                (await ctx.secrets.get(AUTH_TOKEN_CONFIG_NAME)) ?? ""
            const userId = (await ctx.secrets.get(USER_ID_CONFIG_NAME)) ?? ""

            const provider = new ConfigProvider(
                ctx,
                apiUrl,
                onlineStatusLabelFormat,
                statusHistoryLimit,
                statusMessageTemplates,
                authToken,
                userId
            )
            return provider
        } catch (err: unknown) {
            throw buildError(
                "internal",
                "ExtensionConfigurationNotAccessible",
                "Could not retrieve extension configuration."
            )
        }
    }

    dispose(): void {
        this.apiUrlChannel.dispose()
        this.userIdChannel.dispose()
        this.authTokenChannel.dispose()
        this.statusLabelFormatChannel.dispose()
        this.statusHistoryLimitChannel.dispose()
        this.statusMessageTemplatesChannel.dispose()
    }
}
