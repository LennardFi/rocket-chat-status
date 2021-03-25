import * as Https from "https"
import { URL } from "url"
import * as vscode from "vscode"
import { RCSNext } from ".."

/**
 * Builds a request options object used by the Node.js HTTPS client from the
 * given base URL and API request options.
 * @param serverUrl The base URL used to create the URL for the HTTP request.
 * @param apiRequest Options to build the API request. Contains parameters like HTTP
 * method, request body, etc.
 * @returns The HTTPS request options used by the Node.js HTTPS client.
 */
function buildRequestOptions(serverUrl: string, apiRequest: RCSNext.Network.ApiRequest): Https.RequestOptions {
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
 */
export async function apiFetch<T>(serverUrl: string, apiRequest: RCSNext.Network.ApiRequest): Promise<T> {
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

                if (res.statusCode === 401 && apiRequest.auth !== undefined && apiRequest.showAuthTokenError) {
                    void vscode.window
                        .showErrorMessage("Authorization token isn't valid.", "Login")
                        .then(action => {
                            if (action !== undefined) {
                                // TODO: Call login cmd function
                                return
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
