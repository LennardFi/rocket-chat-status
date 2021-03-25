import { RCSNext } from ".."
import { apiFetch, buildInvalidJsonApiResponse } from "./apiFetch"

/**
 * Returns the status currently set for the given user.
 * @param auth The information to authenticate the request and to allow the
 * server to associate the request with a user.
 * @returns The status currently set for the user linked to the given
 * `authToken` and user id.
 */
export default async function getStatus(serverUrl: string, auth: RCSNext.Base.AuthOptions): Promise<RCSNext.Base.Status> {
    try {
        const parsed = await apiFetch<RCSNext.Network.GetStatusApiEndpointResponse>(serverUrl, {
            apiPath: "/users.getStatus",
            auth: auth,
            method: "GET",
        })

        if (parsed) {
            const onlineStatus = parsed.status

            return {
                message: parsed.message,
                online: parsed.connectionStatus === "offline" && onlineStatus === "offline" ? "hidden" : onlineStatus,
            }
        }

        throw new Error(buildInvalidJsonApiResponse("getStatus"))
    } catch (err: unknown) {
        console.error(err)
        throw new Error("Get status failed")
    }
}
