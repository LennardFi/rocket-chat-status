import { Maybe, RocketChatStatus } from ".."
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
export async function login(baseUrl: string, user: string, password: string): Promise<Maybe<RocketChatStatus.Base.Setup>> {
    try {
        const parsed = await apiFetch<RocketChatStatus.Network.LoginApiEndpointResponse>({
            apiPath: "/login",
            jsonBody: {
                user: user,
                password: password,
            },
            method: "POST",
            setup: {
                authToken: "",
                baseUrl: baseUrl,
                userId: "",
            },
            showAuthTokenError: true,
        })

        if ("status" in parsed && parsed.status === "success") {
            return {
                authToken: parsed.data.authToken,
                baseUrl: baseUrl,
                userId: parsed.data.userId,
            }
        }

        throw new Error(buildInvalidJsonApiResponse("login"))
    } catch (err: unknown) {
        console.error(err)
        throw new Error("Login failed")
    }
}

/**
 * Invokes the authentication token in the database.
 * @param auth The information to authenticate the request and to allow the
 * server to associate the request with a user.
 */
export async function logout(setup: RocketChatStatus.Base.Setup): Promise<void> {
    try {
        const parsed = await apiFetch<RocketChatStatus.Network.LogoutApiEndpointResponse>({
            apiPath: "/logout",
            method: "POST",
            setup: setup,
        })

        if ("status" in parsed && parsed.status === "success") {
            return
        }

        throw new Error(buildInvalidJsonApiResponse("logout"))
    } catch (err: unknown) {
        console.error(err)
        throw new Error("Logout failed")
    }
}

