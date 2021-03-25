import { RCSNext } from ".."
import { apiFetch, buildInvalidJsonApiResponse } from "./apiFetch"


/**
 * Invokes the authentication token in the database.
 * @param auth The information to authenticate the request and to allow the
 * server to associate the request with a user.
 */
export async function logout(serverUrl: string, auth: RCSNext.Base.AuthOptions): Promise<void> {
    try {
        const parsed = await apiFetch<RCSNext.Network.LogoutApiEndpointResponse>(serverUrl, {
            apiPath: "/logout",
            auth: auth,
            method: "POST",
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
