export declare namespace RCSNext {
    namespace Base {
        interface AuthOptions {
            authToken: string
            userId: string
        }

        type OnlineStatus =
            | "online"
            | "away"
            | "busy"
            | "hidden"
            | "offline"

        interface Status {
            message: string
            online: OnlineStatus
        }
    }

    namespace Network {

        type HttpMethod = "GET" | "POST"

        interface BaseRequestOptions {
            apiPath: string
            method: HttpMethod
            showAuthTokenError?: boolean
            auth?: Base.AuthOptions
        }

        interface GetApiRequest extends BaseRequestOptions {
            method: "GET"
        }

        interface PostApiRequest extends BaseRequestOptions {
            method: "POST"
            jsonBody?: unknown
        }

        type ApiRequest =
            | GetApiRequest
            | PostApiRequest

        interface LoginApiEndpointResponse {
            data: Base.AuthOptions & {
                me: unknown
            }
            status: "success"
        }

        interface LogoutApiEndpointResponse {
            data: unknown
            status: "success"
        }

        interface GetStatusApiEndpointResponse {
            connectionStatus: "offline" | "online"
            message: string
            status: Base.OnlineStatus
            success: true
        }

        interface SetStatusApiEndpointResponse {
            success: true
        }
    }
}

export type Maybe<T> = T | undefined
