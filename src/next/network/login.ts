import { Maybe, RCSNext } from ".."
import { apiFetch, buildInvalidJsonApiResponse } from "./apiFetch"

/**
 * Creates a new authentication token in the database for the given user. It
 * also returns the authentication token with the user id to allow further
 * communication with the API.
 * @param user The user name or user e-mail address
 * @param password The password of the user
 * @returns The authorization token and user id to authenticate the extension
 * requests at the API.
 */
export async function login(serverUrl: string, user: string, password: string): Promise<Maybe<RCSNext.Base.AuthOptions>> {
    try {
        const parsed = await apiFetch<RCSNext.Network.LoginApiEndpointResponse>(serverUrl, {
            apiPath: "/login",
            jsonBody: {
                user: user,
                password: password,
            },
            method: "POST",
        })

        if ("status" in parsed && parsed.status === "success") {
            return {
                authToken: parsed.data.authToken,
                userId: parsed.data.userId,
            }
        }

        throw new Error(buildInvalidJsonApiResponse("login"))
    } catch (err: unknown) {
        console.error(err)
        throw new Error("Login failed")
    }
}
