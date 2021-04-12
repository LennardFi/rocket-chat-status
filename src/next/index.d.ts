export declare namespace RCSNext {
    namespace Base {
        type Command =
            | "bookmarkCurrentStatus"
            | "deleteData"
            | "downloadStatus"
            | "login"
            | "logout"
            | "setStatus"
            | "setStatusMessage"
            | "setup"

        interface AuthOptions {
            authToken: string
            userId: string
        }

        interface Setup extends AuthOptions {
            baseUrl: string
        }

        type Online =
            | "online"
            | "away"
            | "busy"
            | "hidden"

        interface Status {
            message: string
            offline: boolean
            online: Online
        }

        type StoredStatus = Omit<Status, "offline">

        interface State {
            bookmarked: StoredStatus[]
            history: StoredStatus[]
            status: Status
        }

        type Version =
            | undefined
            | "0.2.0"
    }

    namespace Network {

        type HttpMethod = "GET" | "POST"

        interface BaseRequestOptions {
            apiPath: string
            method: HttpMethod
            setup: Base.Setup | string
            showAuthTokenError?: boolean
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
            data: {
                authToken: string
                me: unknown
                userId: string
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
            status: "away" | "busy" | "online" | "offline"
            success: true
        }

        interface SetStatusApiEndpointResponse {
            success: true
        }
    }
}

export type Maybe<T> = T | undefined
