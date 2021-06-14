import * as Https from "https"
import { URL } from "url"
import * as vscode from "vscode"
import { RocketChatStatus } from ".."
import { buildCommand } from "../../lib/tools"

/**
 * Builds a request options object used by the Node.js HTTPS client from the
 * given base URL and API request options.
 * @param apiRequest Options to build the API request. Contains parameters like HTTP
 * method, request body, base URL, etc.
 * @returns The HTTPS request options used by the Node.js HTTPS client.
 */
function buildRequestOptions(apiRequest: RocketChatStatus.Network.ApiRequest): Https.RequestOptions {
    const apiPath =
        apiRequest.apiPath.startsWith("/") ?
            apiRequest.apiPath.substring(1) :
            `/${apiRequest.apiPath}`

    const headers: Record<string, string> = {
        "accept": "application/json",
    }

    if (typeof apiRequest.setup === "object") {
        headers["x-auth-token"] = apiRequest.setup.authToken
        headers["x-user-id"] = apiRequest.setup.userId
    }

    if (apiRequest.method === "POST" && apiRequest.jsonBody !== undefined) {
        headers["content-type"] = "application/json"
    }

    let baseUrl =
        typeof apiRequest.setup === "string" ?
            apiRequest.setup :
            apiRequest.setup.baseUrl

    if (!baseUrl.endsWith("/")) {
        baseUrl = `${baseUrl}/`
    }

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
 */
export async function apiFetch<T>(apiRequest: RocketChatStatus.Network.ApiRequest): Promise<T> {
    return new Promise((resolve, reject) => {
        const requestOptions = buildRequestOptions(apiRequest)
        const req = Https.request(requestOptions, res => {
            let data = ""
            res.on("data", chunk => {
                data += chunk
            })
            res.on("end", () => {
                if (res.statusCode === undefined) {
                    return reject(new Error("No status code"))
                }

                if (res.statusCode === 401 && typeof apiRequest.setup === "object" && apiRequest.showAuthTokenError) {
                    const loginAction = "Login"
                    void vscode.window
                        .showErrorMessage("Authorization token isn't valid.", loginAction)
                        .then(action => {
                            if (action === loginAction) {
                                return vscode.commands.executeCommand(buildCommand("login"))
                            }
                            return
                        })
                    return reject()
                }

                if (res.statusCode < 200 || res.statusCode >= 400) {
                    return reject(new Error(`API returned with HTTP error: ${res.statusCode} ${res.statusMessage ?? ""}`))
                }

                try {
                    const parsed = JSON.parse(data) as T

                    return resolve(parsed)
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

export function buildInvalidJsonApiResponse(endpoint: string): string {
    return `Invalid API response for ${endpoint} endpoint`
}
