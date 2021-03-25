import { RCSNext } from ".."
import { apiFetch, buildInvalidJsonApiResponse } from "./apiFetch"

/**
 * Sets the current status of the given user 
 * @param auth The information to authenticate the request and to allow the
 * server to associate the request with a user.
 * @param status The new status of the user.
 */
export async function setStatus(serverUrl: string, auth: RCSNext.Base.AuthOptions, status: RCSNext.Base.Status): Promise<void> {
    try {
        const parsed = await apiFetch<RCSNext.Network.SetStatusApiEndpointResponse>(serverUrl, {
            apiPath: "/users.setStatus",
            auth: auth,
            jsonBody: {
                message: status.message,
                status: status.online
            },
            method: "POST",
        })

        if (parsed.success) {
            return
        }

        throw new Error(buildInvalidJsonApiResponse("setStatus"))
    } catch (err: unknown) {
        console.error(err)
        throw new Error("Set status failed")
    }
}
