import * as https from "https"
import { Temporal } from "temporal-polyfill"
import ChannelHost from "../lib/ChannelHost"
import { buildError } from "../lib/tools"
import { ConfigProvider } from "./ConfigProvider"
import { Provider } from "./Provider"

const API_ENDPOINT = "/api/v1"
const LOGIN_API_ENDPOINT = `${API_ENDPOINT}/login`
const LOGOUT_API_ENDPOINT = `${API_ENDPOINT}/logout`
const GET_STATUS_API_ENDPOINT = `${API_ENDPOINT}/users.getStatus`
const SET_STATUS_API_ENDPOINT = `${API_ENDPOINT}/users.setStatus`
const API_REQUEST_TIME_LIMIT_HEADER = "X-Ratelimit-Reset"

export class ApiProvider extends Provider {
    private apiUrlConnection?: RCS.Channel.Channel<string>
    private authTokenConnection?: RCS.Channel.Channel<string>
    private statusHistoryLimitConnection?: RCS.Channel.Channel<number>
    private userIdConnection?: RCS.Channel.Channel<string>
    private blockedUntil?: Temporal.ZonedDateTime
    private canAccessApiChannel: ChannelHost<boolean>
    private statusChannel: ChannelHost<RCS.Base.Status>

    constructor() {
        super()
        this.canAccessApiChannel = new ChannelHost<boolean>(false)
        this.statusChannel = new ChannelHost<RCS.Base.Status>(
            {
                availability: "online",
                connected: false,
                message: "",
            },
            async (e) => {
                if (this.apiUrlConnection === undefined) {
                    throw buildError(
                        "internal",
                        "NoChannelToChannelHost",
                        "apiUrl"
                    )
                }

                if (this.authTokenConnection === undefined) {
                    throw buildError(
                        "internal",
                        "NoChannelToChannelHost",
                        "authToken"
                    )
                }

                if (this.userIdConnection === undefined) {
                    throw buildError(
                        "internal",
                        "NoChannelToChannelHost",
                        "userId"
                    )
                }

                const apiUrl = this.apiUrlConnection.read()
                const authToken = this.authTokenConnection.read()
                const userId = this.userIdConnection.read()

                if (authToken === "" || userId === "") {
                    throw buildError("internal", "MissingSessionCredentials")
                }

                await this.updateStatus(
                    apiUrl,
                    userId,
                    authToken,
                    e.next.message,
                    e.next.availability
                )

                const downloadedStatus = await this.getStatus(
                    apiUrl,
                    userId,
                    authToken
                )

                return downloadedStatus
            }
        )
    }

    async addProviderDependency(provider: ConfigProvider): Promise<void> {
        this.apiUrlConnection = provider.apiUrl(
            (e) => {
                if (e.cause === "me") {
                    if (
                        (this.apiUrlConnection?.read() ?? "" !== "") &&
                        (this.userIdConnection?.read() ?? "" !== "") &&
                        (this.authTokenConnection?.read() ?? "" !== "")
                    ) {
                        this.canAccessApiChannel.update(true)
                    } else {
                        this.canAccessApiChannel.update(false)
                    }
                }
            },
            undefined,
            () => {
                this.apiUrlConnection = undefined
            }
        )
        this.authTokenConnection = provider.authToken(
            (e) => {
                if (e.cause === "me") {
                    if (
                        (this.apiUrlConnection?.read() ?? "" !== "") &&
                        (this.userIdConnection?.read() ?? "" !== "") &&
                        (this.authTokenConnection?.read() ?? "" !== "")
                    ) {
                        this.canAccessApiChannel.update(true)
                    } else {
                        this.canAccessApiChannel.update(false)
                    }
                }
            },
            undefined,
            () => {
                this.authTokenConnection = undefined
            }
        )
        this.userIdConnection = provider.userId(
            (e) => {
                if (e.cause === "me") {
                    if (
                        (this.apiUrlConnection?.read() ?? "" !== "") &&
                        (this.userIdConnection?.read() ?? "" !== "") &&
                        (this.authTokenConnection?.read() ?? "" !== "")
                    ) {
                        this.canAccessApiChannel.update(true)
                    } else {
                        this.canAccessApiChannel.update(false)
                    }
                }
            },
            undefined,
            () => {
                this.userIdConnection = undefined
            }
        )
        this.statusHistoryLimitConnection = provider.statusHistoryLimit(
            undefined,
            undefined,
            () => {
                this.statusHistoryLimitConnection = undefined
            }
        )
    }

    canAccessApi(
        onChangeHandler?: RCS.Channel.ChangeHandler<boolean>,
        onRejectHandler?: RCS.Channel.RejectHandler<boolean>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<boolean>
    ): RCS.Channel.Channel<boolean> {
        return this.canAccessApiChannel.createChannel(
            onChangeHandler,
            onRejectHandler,
            onRevokeHandler
        )
    }

    status(
        onChangeHandler?: RCS.Channel.ChangeHandler<RCS.Base.Status>,
        onRejectHandler?: RCS.Channel.RejectHandler<RCS.Base.Status>,
        onRevokeHandler?: RCS.Channel.RevokeHandler<RCS.Base.Status>
    ): RCS.Channel.Channel<RCS.Base.Status> {
        return this.statusChannel.createChannel(
            onChangeHandler,
            onRejectHandler,
            onRevokeHandler
        )
    }

    async login(userName: string, password: string): Promise<void> {
        if (this.apiUrlConnection === undefined) {
            throw buildError(
                "internal",
                "NotConfigured",
                "API URL not configured."
            )
        }

        const [userId, authToken] = await this.requestLogin(
            this.apiUrlConnection.read(),
            userName,
            password
        )

        if (
            this.userIdConnection === undefined &&
            this.authTokenConnection === undefined
        ) {
            throw buildError(
                "internal",
                "ChannelHostConnectionLost",
                "No connection to user id and auth token channel."
            )
        }

        if (this.userIdConnection === undefined) {
            throw buildError(
                "internal",
                "ChannelHostConnectionLost",
                "No connection to user id channel."
            )
        }

        if (this.authTokenConnection === undefined) {
            throw buildError(
                "internal",
                "ChannelHostConnectionLost",
                "No connection to auth token channel."
            )
        }

        await this.userIdConnection.propose(userId)
        await this.authTokenConnection.propose(authToken)
    }

    async logout(): Promise<void> {
        if (this.apiUrlConnection === undefined) {
            throw buildError(
                "internal",
                "NotConfigured",
                "API URL not configured."
            )
        }

        if (
            this.userIdConnection === undefined &&
            this.authTokenConnection === undefined
        ) {
            throw buildError(
                "internal",
                "NotConfigured",
                "User id and auth token not configured."
            )
        }

        if (this.userIdConnection === undefined) {
            throw buildError(
                "internal",
                "NotConfigured",
                "User id not configured."
            )
        }

        if (this.authTokenConnection === undefined) {
            throw buildError(
                "internal",
                "NotConfigured",
                "Auth token not configured."
            )
        }

        await this.requestLogout(
            this.apiUrlConnection.read(),
            this.userIdConnection.read(),
            this.authTokenConnection.read()
        )

        await this.userIdConnection.propose("")
        await this.authTokenConnection.propose("")
    }

    private async requestApi<T>(
        apiRequest: RCS.Api.ApiRequest,
        data?: unknown
    ): Promise<RCS.Api.ApiResponse<T>> {
        if (DEV_RELEASE) {
            console.debug(
                `Requesting API endpoint: ${apiRequest.method} ${apiRequest.apiBaseUrl}`
            )
        }

        if (this.blockedUntil !== undefined) {
            if (
                Temporal.Now.zonedDateTimeISO().since(this.blockedUntil)
                    .sign !== 1
            ) {
                throw buildError("internal", "ApiReturnedTooManyRequests")
            }
        }

        const _auth =
            apiRequest.auth !== undefined
                ? `Basic ${Buffer.from(
                      `${apiRequest.auth[0]}:${apiRequest.auth[1]}`
                  ).toString("base64")}`
                : undefined

        const _queryParameters =
            apiRequest.queryParams !== undefined
                ? Object.entries(apiRequest.queryParams)
                      .map(([key, value]) => {
                          return `${key}=${value}`
                      })
                      .join("&")
                : undefined

        const _apiUrl = `${apiRequest.apiBaseUrl}${
            _queryParameters !== undefined ? `?${_queryParameters}` : ""
        }`

        return new Promise((resolve, reject) => {
            const req = https.request(
                _apiUrl,
                {
                    method: apiRequest.method,
                    auth: _auth,
                },
                (res) => {
                    let data = ""
                    res.on("data", (chunk) => {
                        data += chunk
                    })
                    res.on("end", () => {
                        if (res.statusCode === undefined) {
                            return reject(
                                buildError(
                                    "internal",
                                    "ApiRequestUnknownError",
                                    "No status code in response."
                                )
                            )
                        }

                        if (
                            res.statusCode === 401 &&
                            apiRequest.auth !== undefined
                        ) {
                            return resolve({
                                success: false,
                                type: "Unauthorized",
                                result: undefined,
                            })
                        }

                        if (res.statusCode < 200 || res.statusCode >= 400) {
                            return resolve({
                                success: false,
                                type: "HttpResponse",
                                result: {
                                    message: res.statusMessage ?? "",
                                    status: res.statusCode,
                                },
                            })
                        }

                        if (res.statusCode === 429) {
                            const headerValue =
                                res.headers[API_REQUEST_TIME_LIMIT_HEADER]
                            if (
                                headerValue === undefined ||
                                Array.isArray(headerValue)
                            ) {
                                return reject(
                                    buildError(
                                        "internal",
                                        "ApiReturnedInvalidResponse",
                                        `No valid ${API_REQUEST_TIME_LIMIT_HEADER} header value: ${JSON.stringify(
                                            headerValue
                                        )}`
                                    )
                                )
                            }

                            const dateValue = Temporal.Instant.fromEpochSeconds(
                                Number.parseInt(headerValue)
                            ).toZonedDateTimeISO(new Temporal.TimeZone("UTC"))

                            this.blockedUntil = dateValue

                            return reject(
                                buildError(
                                    "internal",
                                    "ApiReturnedTooManyRequests",
                                    `No requests allowed until ${dateValue.toString()}`,
                                    true
                                )
                            )
                        }

                        try {
                            return resolve({
                                success: true,
                                result: JSON.parse(data) as T,
                            })
                        } catch (err: unknown) {
                            return reject(
                                buildError(
                                    "internal",
                                    "ApiReturnedInvalidResponse",
                                    "Could not parse API response"
                                )
                            )
                        }
                    })
                }
            )
            if (data !== undefined) {
                req.write(JSON.stringify(data))
            }
        })
    }

    private async requestLogin(
        apiUrl: string,
        userName: string,
        password: string
    ): Promise<RCS.Api.AuthOptions> {
        const apiResponse = await this.requestApi<RCS.Api.LoginApiResponse>({
            apiBaseUrl: apiUrl,
            path: LOGIN_API_ENDPOINT,
            method: "POST",
            queryParams: {
                user: userName,
                password: password,
            },
        })

        if (!apiResponse.success) {
            if (apiResponse.type === "Unauthorized") {
                throw buildError("internal", "ApiReturnedUnauthorized")
            }
            if (apiResponse.type === "HttpResponse") {
                throw buildError(
                    "internal",
                    "ApiReturnedError",
                    `${apiResponse.result.status} ${apiResponse.result.message}`
                )
            }
        }

        return [
            apiResponse.result.data.userId,
            apiResponse.result.data.authToken,
        ]
    }

    private async requestLogout(
        apiUrl: string,
        userId: string,
        authToken: string
    ): Promise<void> {
        const apiResponse = await this.requestApi<RCS.Api.LogoutApiResponse>({
            apiBaseUrl: apiUrl,
            path: LOGOUT_API_ENDPOINT,
            method: "POST",
            auth: [userId, authToken],
        })

        if (!apiResponse.success) {
            if (apiResponse.type === "Unauthorized") {
                throw buildError("internal", "ApiReturnedUnauthorized")
            }
            if (apiResponse.type === "HttpResponse") {
                throw buildError(
                    "internal",
                    "ApiReturnedError",
                    `${apiResponse.result.status} ${apiResponse.result.message}`
                )
            }
        }

        return
    }

    private async getStatus(
        apiUrl: string,
        userId: string,
        authToken: string
    ): Promise<RCS.Base.Status> {
        const apiResponse = await this.requestApi<RCS.Api.GetStatusApiResponse>(
            {
                apiBaseUrl: apiUrl,
                path: GET_STATUS_API_ENDPOINT,
                method: "GET",
                auth: [userId, authToken],
            }
        )

        if (!apiResponse.success) {
            if (apiResponse.type === "Unauthorized") {
                throw buildError("internal", "ApiReturnedUnauthorized")
            }
            if (apiResponse.type === "HttpResponse") {
                throw buildError(
                    "internal",
                    "ApiReturnedError",
                    `${apiResponse.result.status} ${apiResponse.result.message}`
                )
            }
        }

        return {
            availability: apiResponse.result.status,
            connected: apiResponse.result.connectionStatus === "online",
            message: apiResponse.result.message,
        }
    }

    private async updateStatus(
        apiUrl: string,
        userId: string,
        authToken: string,
        status: string,
        availability: RCS.Base.UserAvailability
    ): Promise<void> {
        const apiResponse = await this.requestApi<RCS.Api.SetStatusApiResponse>(
            {
                apiBaseUrl: apiUrl,
                path: SET_STATUS_API_ENDPOINT,
                method: "GET",
                auth: [userId, authToken],
            },
            {
                message: status,
                status: availability,
            }
        )

        if (!apiResponse.success) {
            if (apiResponse.type === "Unauthorized") {
                throw buildError("internal", "ApiReturnedUnauthorized")
            }
            if (apiResponse.type === "HttpResponse") {
                throw buildError(
                    "internal",
                    "ApiReturnedError",
                    `${apiResponse.result.status} ${apiResponse.result.message}`
                )
            }
        }

        return
    }

    dispose(): void {
        this.authTokenConnection?.dispose()
        this.apiUrlConnection?.dispose()
        this.statusChannel.dispose()
        this.statusHistoryLimitConnection?.dispose()
        this.userIdConnection?.dispose()
    }
}
