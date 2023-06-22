declare namespace RCS {
    namespace Api {
        type AuthOptions = [userId: string, authToken: string]

        type HttpMethod = "GET" | "POST"

        interface ApiRequest {
            apiBaseUrl: string
            method: HttpMethod
            path: string
            auth?: AuthOptions
            jsonBody?: unknown
            queryParams?: Record<string, string>
        }

        interface ApiResponseBase {
            success: boolean
            result: unknown
        }

        interface SuccessApiResponse<R> extends ApiResponseBase {
            success: true
            result: R
        }

        interface ErrorApiResponseBase<T, R> extends ApiResponseBase {
            success: false
            type: T
            result: R
        }

        type ErrorApiResponse =
            | ErrorApiResponseBase<"Unauthorized", undefined>
            | ErrorApiResponseBase<
                  "HttpResponse",
                  {
                      status: number
                      message: string
                  }
              >

        type ApiResponse<T> = SuccessApiResponse<T> | ErrorApiResponse

        interface LoginApiResponse {
            status: "success"
            data: {
                authToken: string
                userId: string
            }
        }

        // interface LoginSuccessApiResponse {
        //     status: "success"
        //     data: {
        //         authToken: string
        //         userId: string
        //     }
        // }

        // interface LoginErrorApiResponse {
        //     status: "error"
        //     message: string
        //     error: string
        // }

        // type LoginApiResponse = LoginSuccessApiResponse | LoginErrorApiResponse

        interface LogoutApiResponse {
            status: "success"
            data: unknown
        }

        // interface LogoutSuccessApiResponse {
        //     status: "success"
        //     data: unknown
        // }

        // interface LogoutErrorApiResponse {
        //     status: "error"
        //     message: string
        // }

        // type LogoutApiResponse =
        //     | LogoutSuccessApiResponse
        //     | LogoutErrorApiResponse

        interface GetStatusApiResponse {
            connectionStatus: "online" | "offline"
            message: string
            status: Base.UserAvailability
            success: true
        }

        // interface GetStatusSuccessApiResponse {
        //     connectionStatus: "online" | "offline"
        //     message: string
        //     status: Base.UserAvailability
        //     success: true
        // }

        // interface GetStatusErrorApiResponse {
        //     status: "error"
        //     message: string
        // }

        // type GetStatusApiResponse =
        //     | GetStatusSuccessApiResponse
        //     | GetStatusErrorApiResponse

        interface SetStatusApiResponse {
            success: true
        }

        // interface SetStatusSuccessApiResponse {
        //     success: true
        // }

        // interface SetStatusErrorApiResponse {
        //     status: "error"
        //     message: string
        // }

        // type SetStatusApiResponse =
        //     | SetStatusSuccessApiResponse
        //     | SetStatusErrorApiResponse
    }

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

        type UserAvailability = "online" | "away" | "busy" | "hidden"

        interface Status {
            availability: UserAvailability
            /**
             * `false` if no client is connected to the server, otherwise `true`.
             */
            connected: boolean
            /**
             * The text linked to the online status.
             */
            message: string
        }

        type StoredStatus = Omit<Status, "connected">

        interface Configuration {
            apiUrl: Maybe<string>
            bookmarkedStatuses: RCS.Base.StoredStatus[]
            onlineStatusLabelFormat: string
            statusHistoryLimit: number
            statusMessageTemplates: string[]
        }
    }

    /**
     * A channel is a connection to an encapsulated value a subscriber can read
     * from and propose a new value to by using this channel.
     * Additionally the given change handler will be called whenever the value
     * was changed.
     *
     * If a subscriber wants to propose a new value to the channel host (the
     * module or scope of the program which accepts channel to the encapsulated
     * value) the host has to approve the new value. This happens
     * asynchronously. If the new value got rejected every subscriber who has
     * defined an `onRejectHandler` will be informed. If the new value got
     * accepted every subscriber will be informed about the change.
     */
    namespace Channel {
        type FunctionEventCause = "provider" | "subscriber"

        type HandlerEventCause = "me" | FunctionEventCause

        interface ChangeHandlerEvent<T> {
            /**
             * Defines who caused the change.
             */
            cause: HandlerEventCause
            /**
             * The new value after the change.
             */
            next: T
            /**
             * The previous value before the change.
             */
            prev: T
        }

        interface RejectHandlerEvent<T> {
            /**
             * Defines who caused the rejection.
             */
            cause: HandlerEventCause
            /**
             * The value wich got rejected.
             */
            rejectedValue: T
            /**
             * The value of the channel before the provider has started the
             * approve function.
             */
            prev: T
        }

        interface RevokeHandlerEvent<T> {
            /**
             * `true` if the subscription got revoked by the channel provider,
             * otherwise `false`.
             */
            causedByProvider: boolean
            /**
             * The current value of the channel before the subscription got
             * revoked.
             */
            lastValue: T
        }

        type ChangeHandler<T> = (e: ChangeHandlerEvent<T>) => void

        type RejectHandler<T> = (e: RejectHandlerEvent<T>) => void

        type RevokeHandler<T> = (e: RevokeHandlerEvent<T>) => void

        interface Channel<T> {
            /**
             * Proposes a new value to the channel host.
             *
             * If the new value is equal (`===`) to the previous value the value
             * propose will be ignored.
             */
            propose(newValue: T): Promise<T>
            /**
             * This function returns at every moment the current value of the
             * channel. It doesn't get effected by proposed values.
             */
            read(): T
            /**
             * Disposes the subscription to the channel.
             */
            dispose(): void
        }

        interface ApproveFunctionEvent<T> {
            /**
             * Defines who caused the change.
             */
            cause: FunctionEventCause
            /**
             * The value wich got approved.
             */
            next: T
            /**
             * The value of the channel before the provider approved the new
             * value.
             */
            prev: T
        }

        interface RejectFunctionEvent<T> {
            /**
             * Defines who caused the change.
             */
            cause: FunctionEventCause
            /**
             * The value wich got rejected.
             */
            next: T
            /**
             * The value of the channel before the provider has rejected the
             * proposed value.
             */
            prev: T
        }

        /**
         * This function will be used to approve proposed values. If the promise
         * resolves the new value got approved, otherwise the value got
         * rejected.
         */
        type ApproveFunction<T> = (e: ApproveFunctionEvent<T>) => Promise<T>

        /**
         * This function will be called when a proposed value got rejected.
         */
        type RejectFunction<T> = (e: RejectFunctionEvent<T>) => Promise<void>

        interface SubscriberStorage<T> {
            changeHandler?: ChangeHandler<T>
            revokeHandler?: RevokeHandler<T>
            rejectHandler?: RejectHandler<T>
        }
    }

    namespace Error {
        type ExceptionScope = "debug" | "internal" | "user"

        type ErrorCode =
            | "ApiRequestUnknownError"
            | "ApiReturnedError"
            | "ApiReturnedInvalidResponse"
            | "ApiReturnedTooManyRequests"
            | "ApiReturnedUnauthorized"
            | "ChannelHostConnectionLost"
            | "ExtensionConfigurationNotAccessible"
            | "GitExtensionError"
            | "GitExtensionNotAvailable"
            | "InvalidApiUrl"
            | "InvalidDynamicValue"
            | "InvalidSubscriberId"
            | "InvalidTemplateString"
            | "MissingSessionCredentials"
            | "NoChannelToChannelHost"
            | "NotConfigured"
            | "NotImplemented"
            | "ParseInvalidTimeRange"
            | "ProposedValueNotAllowed"
            | "UnknownError"

        interface Exception {
            scope: ExceptionScope
            type: "RocketChatStatusException"
            showOutputChannel: boolean
            code?: ErrorCode
            msg?: string
        }
    }

    namespace Logging {
        type LoggingType = "error" | "debug" | "info" | "warning"
    }

    namespace Templates {
        interface Template extends Base.StoredStatus {
            /**
             * The name of the template. Mainly displayed in the template
             * selection prompt.
             */
            label: string
            /**
             * The message template wich may contain dynamic value expressions.
             */
            message: string
        }

        interface DynamicTemplateValueBase<T extends string> {
            type: T
        }

        type DirectoryNameInputWordFormat =
            | "camel"
            | "kebab"
            | "pascal"
            | "snake"
            | "space"
            | "no-splitting"

        type DirectoryNameReformatWordCasing =
            | "low"
            | "unchanged"
            | "up"
            | "upFirst"
            | "upWord"
            | "upWordExceptFirst"

        interface DynamicDirectoryValue
            extends DynamicTemplateValueBase<"directory-name"> {
            /**
             * Specifies how many parent directories the program must go up to
             * return the name of the correct parent folder.
             * @default 0
             */
            directoryOffset?: number
            /**
             * The format which determines how the directory name will be
             * splitted.
             * @default "space"
             */
            inputWordFormat?: DirectoryNameInputWordFormat
            /**
             * Defines how the casing of the separated directory name parts will
             * changed.
             * @default "unchanged"
             */
            reformatWordCasing?: DirectoryNameReformatWordCasing
            /**
             * Defines how the separated directory name parts will be rejoined
             * together.
             * @default " "
             */
            outputWordJoiner?: string
        }

        type GitReferenceType = "branch" | "commit"

        interface DynamicGitReferenceValue
            extends DynamicTemplateValueBase<"git-reference"> {
            /**
             * Defines the git reference type.
             *
             * @default "branch"
             */
            referenceType: GitReferenceType
        }

        interface DynamicInputValue extends DynamicTemplateValueBase<"input"> {
            /**
             * If `false` only values defined in `selectionValues` property can
             * be used, otherwise new values can be used, too.
             *
             * Can only be used if `mandatoryValues` is not defined.
             *
             * @default undefined
             */
            optionalValues?: string[]
            /**
             * A list of selectable values for the input prompt.
             *
             * Can only be used if `optionalValues` is not defined.
             *
             * @default undefined
             */
            mandatoryValues?: string[]
        }

        interface TimeRange {
            hours?: number
            minutes?: number
        }

        type TimeUnit = "hours" | "minutes"

        type RoundDirection = "nearest" | "down" | "up"

        interface DynamicTimeValue extends DynamicTemplateValueBase<"time"> {
            /**
             * The seconds based time offset defined by the offset modifier.
             *
             * @default 0
             */
            offset?: number
            /**
             * The minimum value to round the returned time value.
             *
             * @default [1, "minutes", "nearest"]
             */
            round?: [number, TimeUnit, RoundDirection]
            /**
             * The output format used to display the time value. Predefined
             * formats are converted to a string notation: `iso` -> `"[HH]-[MM]-[ss]"`
             *
             * @default "[HH]:[MM]"
             */
            format?: string
        }

        type DynamicTemplateValue =
            | DynamicDirectoryValue
            | DynamicGitReferenceValue
            | DynamicInputValue
            | DynamicTimeValue

        type StatusMessageContent = DynamicTemplateValue | string
    }
}

declare type Maybe<T> = T | undefined

declare const DEV_RELEASE: boolean
declare const RCS_COMMAND_OPEN_MENU: string
declare const RCS_CURRENT_VERSION: string
declare const RCS_HISTORY_LIMIT_DEFAULT_VALUE: number
declare const RCS_STATUS_LABEL_FORMAT_DEFAULT_VALUE: string
