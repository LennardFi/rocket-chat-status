import * as Https from "https"
import { URL } from "url"
import { RocketChatStatus } from ".."
import { logMessage } from "./internals"

/**
 * Builds a request options object used by the Node.js HTTPS client from the
 * given base URL and API request options.
 * @param serverUrl The base URL used to create the URL for the HTTP request.
 * @param apiRequest Options to build the API request. Contains parameters like HTTP
 * method, request body, etc.
 * @returns The HTTPS request options used by the Node.js HTTPS client.
 */
const buildRequestOptions =
    (serverUrl: string, apiRequest: RocketChatStatus.ApiRequest): Https.RequestOptions => {
        const apiPath =
            apiRequest.apiPath.startsWith("/") ?
                apiRequest.apiPath.substring(1) :
                `/${apiRequest.apiPath}`

        const headers: Record<string, string> = {
            "accept": "application/json",
        }

        if (apiRequest.auth) {
            headers["x-auth-token"] = apiRequest.auth.authToken
            headers["x-user-id"] = apiRequest.auth.userId
        }

        if (apiRequest.method === "POST" && apiRequest.jsonBody !== undefined) {
            headers["content-type"] = "application/json"
        }

        const baseUrl =
            serverUrl.endsWith("/") ?
                serverUrl :
                `${serverUrl}/`

        const endpoint = new URL(`${baseUrl}api/v1/${apiPath}`)

        return {
            headers: headers,
            host: endpoint.host,
            method: apiRequest.method,
            path: endpoint.pathname,
            protocol: endpoint.protocol,
        }
    }

/**
 * Request the Rocket.Chat on the given URL according to the request option
 * given in the `apiRequest` parameter.
 * @param serverUrl The base URL. This URL will be combined with the path given in
 * the `apiRequest` parameter.
 * @param apiRequest Options to build the request. Contains parameter like HTTP
 * method, request body, etc.
 * @param withData Specifies whether the API endpoint is expected to return data.
 * @returns
 * If `body` is `true` the returned promise resolves only if the API returned
 * with a success response and the response contains data.
 *
 * If `body` is `false` the promise will be resolved if the API returned with a
 * success response and the response does not contain data.
 *
 * The promise will be rejected in every other case.
 */
async function apiFetch<T>(serverUrl: string, apiRequest: RocketChatStatus.ApiRequest): Promise<T> {
    return new Promise((resolve, reject) => {
        const requestOptions = buildRequestOptions(serverUrl, apiRequest)
        const req = Https.request(requestOptions, res => {
            let data = ""
            res.on("data", chunk => {
                data += chunk
            })
            res.on("end", () => {
                if (res.statusCode === undefined) {
                    return reject(new Error("No status code"))
                }

                if (res.statusCode < 200 || res.statusCode >= 400) {
                    return reject(new Error(`API returned with HTTP error: ${res.statusCode} ${res.statusMessage ?? ""}`))
                }

                if (res.statusCode === 429) {
                    return reject(new Error(`API returned with HTTP error: Too many requests.`))
                }

                try {
                    return resolve(JSON.parse(data) as T)
                } catch (err: unknown) {
                    const message = "Could not parse API response"
                    console.error(message)
                    return reject(new Error(message))
                }
            })
        })
        if (apiRequest.method === "POST" && apiRequest.jsonBody !== undefined) {
            req.write(JSON.stringify(apiRequest.jsonBody))
        }
        req.end()
    })
}

function buildInvalidJsonApiResponse(endpoint: string): string {
    return `Invalid API response for ${endpoint} endpoint`
}

/**
 * Creates a new authentication token in the database for the given user. It
 * also returns the authentication token with the user id to allow further
 * communication with the API.
 * @param user The user name or user e-mail address
 * @param password The password of the user
 * @returns The authorization token and user id to authenticate the extension
 * requests at the API.
 */
export async function login(serverUrl: string, user: string, password: string): Promise<RocketChatStatus.AuthOptions> {
    const parsed = await apiFetch<RocketChatStatus.LoginApiEndpointResponse>(serverUrl, {
        apiPath: "/login",
        jsonBody: {
            user: user,
            password: password,
        },
        method: "POST",
    })

    if ("status" in parsed && parsed.status === "success") {
        logMessage("Successfully logged in.")
        return {
            authToken: parsed.data.authToken,
            userId: parsed.data.userId,
        }
    }

    throw new Error(buildInvalidJsonApiResponse("login"))
}

/**
 * Invokes the authentication token in the database.
 * @param auth The information to authenticate the request and to allow the
 * server to associate the request with a user.
 */
export async function logout(serverUrl: string, auth: RocketChatStatus.AuthOptions): Promise<void> {
    const parsed = await apiFetch<RocketChatStatus.LogoutApiEndpointResponse>(serverUrl, {
        apiPath: "/logout",
        auth: auth,
        method: "POST",
    })

    if ("status" in parsed && parsed.status === "success") {
        logMessage("Successfully logged out.")
        return
    }

    throw new Error(buildInvalidJsonApiResponse("logout"))
}

/**
 * Returns the status currently set for the given user.
 * @param auth The information to authenticate the request and to allow the
 * server to associate the request with a user.
 * @returns The status currently set for the user linked to the given
 * `authToken` and user id.
 */
export async function getStatus(serverUrl: string, auth: RocketChatStatus.AuthOptions): Promise<RocketChatStatus.Status> {
    const parsed = await apiFetch<RocketChatStatus.GetStatusApiEndpointResponse>(serverUrl, {
        apiPath: "/users.getStatus",
        auth: auth,
        method: "GET",
    })

    if (parsed.success) {
        logMessage("Downloaded current status.")
        return {
            message: parsed.message,
            online: parsed.status,
        }
    }

    throw new Error(buildInvalidJsonApiResponse("getStatus"))
}

/**
 * Sets the current status of the given user 
 * @param auth The information to authenticate the request and to allow the
 * server to associate the request with a user.
 * @param status The new status of the user.
 */
export async function setStatus(serverUrl: string, auth: RocketChatStatus.AuthOptions, status: RocketChatStatus.Status): Promise<void> {
    const parsed = await apiFetch<RocketChatStatus.SetStatusApiEndpointResponse>(serverUrl, {
        apiPath: "/users.setStatus",
        auth: auth,
        jsonBody: {
            message: status.message,
            status: status.online
        },
        method: "POST",
    })

    if (parsed.success) {
        logMessage(`Uploaded new status: [${status.online}] "${status.message}"`)
        return
    }

    throw new Error(buildInvalidJsonApiResponse("setStatus"))
}
