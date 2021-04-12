import { RCSNext } from ".."
import { apiFetch, buildInvalidJsonApiResponse } from "./apiFetch"

/**
 * Returns the status currently set for the given user.
 * @param setup The information to authenticate the request and to allow the
 * server to associate the request with a user.
 * @returns The status currently set for the user linked to the given
 * `authToken` and user id.
 */
export async function downloadStatus(setup: RCSNext.Base.Setup): Promise<RCSNext.Base.Status> {
    try {
        const parsed = await apiFetch<RCSNext.Network.GetStatusApiEndpointResponse>({
            apiPath: "/users.getStatus",
            method: "GET",
            setup: setup,
        })

        if (parsed) {
            const onlineStatus = parsed.status

            return {
                message: parsed.message,
                offline: parsed.connectionStatus === "offline",
                online: onlineStatus === "offline" ? "hidden" : onlineStatus,
            }
        }

        throw new Error(buildInvalidJsonApiResponse("getStatus"))
    } catch (err: unknown) {
        console.error(err)
        throw new Error("Get status failed")
    }
}

/**
 * Sets the current status of the given user 
 * @param auth The information to authenticate the request and to allow the
 * server to associate the request with a user.
 * @param status The new status of the user.
 */
export async function uploadStatus(setup: RCSNext.Base.Setup, status: RCSNext.Base.Status): Promise<void> {
    try {
        const parsed = await apiFetch<RCSNext.Network.SetStatusApiEndpointResponse>({
            apiPath: "/users.setStatus",
            jsonBody: {
                message: status.message,
                status: status.online === "hidden" ? "offline" : status.online,
            },
            method: "POST",
            setup: setup,
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
