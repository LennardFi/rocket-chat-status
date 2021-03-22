import * as vscode from "vscode"

export declare namespace RocketChatStatus {
    type HttpMethod = "GET" | "POST"

    interface AuthOptions {
        authToken: string
        userId: string
    }

    interface BaseRequestOptions {
        apiPath: string
        method: HttpMethod
        auth?: AuthOptions
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

    type Command =
        | "bookmarkCurrentStatus"
        | "deleteStatusHistory"
        | "downloadStatus"
        | "login"
        | "logout"
        | "setStatus"
        | "setStatusMessage"
        | "setup"

    type OnlineStatus =
        | "away"
        | "busy"
        | "offline"
        | "online"

    type OnlineStatusQuickPickLabel =
        | "Away"
        | "Busy"
        | "Offline"
        | "Online"

    type SelectionType =
        | "cache"
        | "current"
        | "bookmarked"

    interface Status {
        message: string
        online: OnlineStatus
    }

    interface StatusSelectionInputOption<C extends boolean> {
        /**
         * If `true` all cached statuses will be added to the selection.
         */
        history?: boolean
        /**
         * The VSCode extension context used internally
         */
        context: vscode.ExtensionContext
        /**
         * If `true` an entry to create a new status will be added.
         */
        create?: C
        /**
         * If `true` icons will be added to the entry label.
         */
        icons?: boolean
        /**
         * If `true` bookmarked statuses will be added to the selection.
         */
        bookmarked?: boolean
    }

    interface StatusQuickPickItem<T> extends vscode.QuickPickItem {
        label: string
        value: T
    }

    interface LoginApiEndpointResponse {
        data: AuthOptions & {
            me: unknown
        }
        status: "success"
    }

    interface LogoutApiEndpointResponse {
        data: unknown
        status: "success"
    }

    interface GetStatusApiEndpointResponse {
        connectionStatus: unknown
        message: string
        status: OnlineStatus
        success: true
    }

    interface SetStatusApiEndpointResponse {
        success: true
    }
}

export type Maybe<T> = T | undefined
