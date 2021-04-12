import { URL } from "url"
import * as vscode from "vscode"
import * as api from "./lib/api"
import * as internals from "./lib/internals"
import * as tools from "./lib/tools"

export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
	{
		const baseUrl = await internals.getApiUrl()
		const authOptions = await internals.getAuthOptions(ctx)

		try {
			await internals.initStatusBarItem(ctx)

			if (baseUrl !== undefined && authOptions !== undefined) {
				const currentStatus = await api.getStatus(baseUrl, authOptions)
				await internals.setCurrentStatus(ctx, currentStatus)
			}
		} catch (err: unknown) {
			await vscode.window.showErrorMessage("Could not load current Rocket.Chat status.")
		}
	}

	ctx.subscriptions.push(vscode.commands.registerCommand(tools.buildCommand("bookmarkCurrentStatus"), async () => {
		const current = await internals.getCurrentStatus(ctx)

		if (current === undefined) {
			return await internals.showNoCurrentStateError()
		}

		await internals.addBookmarkedStatus(current)
		await internals.removeFromStatusHistory(ctx, current)
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(tools.buildCommand("deleteStatusHistory"), async () => {
		await internals.deleteStatusHistory(ctx)
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(tools.buildCommand("downloadStatus"), async () => {
		const apiEndpoint = await internals.getApiUrl()

		if (apiEndpoint === undefined) {
			return await internals.showNotConfiguredError()
		}

		const authOptions = await internals.getAuthOptions(ctx)

		if (authOptions === undefined) {
			return await internals.showNotLoggedInError()
		}

		const status = await api.getStatus(apiEndpoint, authOptions)

		await internals.setCurrentStatus(ctx, status)
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(tools.buildCommand("login"), async () => {
		const apiEndpoint = await internals.getApiUrl()

		if (apiEndpoint === undefined) {
			return await internals.showNotConfiguredError()
		}

		const user = await vscode.window.showInputBox({
			prompt: "Username or mail"
		})

		if (user === undefined) {
			return
		}

		const password = await vscode.window.showInputBox({
			password: true,
			prompt: "Password",
		})

		if (password === undefined) {
			return
		}

		const authOptions = await api.login(apiEndpoint, user, password)

		await internals.setAuthOptions(ctx, authOptions)

		const status = await api.getStatus(apiEndpoint, authOptions)
		await internals.setCurrentStatus(ctx, status)
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(tools.buildCommand("logout"), async () => {
		await internals.setCurrentStatus(ctx, undefined)

		const authOptions = await internals.getAuthOptions(ctx)

		if (authOptions === undefined) {
			return await internals.showNotLoggedInError()
		}

		const apiEndpoint = await internals.getApiUrl()

		if (apiEndpoint !== undefined) {
			return await api.logout(apiEndpoint, authOptions)
		} else {
			const result = await vscode.window.showWarningMessage(
				"Currently, no server URL has been configured. " +
				"If you delete the authentication data now, " +
				"it will not be invalidated on the server. " +
				"This could allow someone to log into your account " +
				"using these authentication credentials.",
				"Continue",
				"Abort"
			)

			if (result === "Abort" || result === undefined) {
				return
			}
		}

		await internals.deleteAuthOptions(ctx)
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(tools.buildCommand("setStatus"), async () => {
		const apiEndpoint = await internals.getApiUrl()

		if (apiEndpoint === undefined) {
			return await internals.showNotConfiguredError()
		}

		const authOptions = await internals.getAuthOptions(ctx)

		if (authOptions === undefined) {
			return await internals.showNotLoggedInError()
		}

		let selected = await internals.showStatusSelectionInput({
			bookmarked: true,
			context: ctx,
			create: true,
			history: true,
			icons: true,
		})

		if (selected === undefined) {
			return
		}

		if (selected === "new") {
			const onlineStatus = await internals.showOnlineStatusPicker(ctx)

			if (onlineStatus === undefined) {
				return
			}

			const statusMessage = await internals.showMessagePicker(ctx)

			if (statusMessage === undefined) {
				return
			}

			selected = {
				message: statusMessage,
				online: onlineStatus,
			}
		}

		await api.setStatus(apiEndpoint, authOptions, selected)

		await internals.setCurrentStatus(ctx, selected)
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(tools.buildCommand("setStatusMessage"), async () => {
		const apiEndpoint = await internals.getApiUrl()

		if (apiEndpoint === undefined) {
			return await internals.showNotConfiguredError()
		}

		const authOptions = await internals.getAuthOptions(ctx)

		if (authOptions === undefined) {
			return await internals.showNotLoggedInError()
		}

		const current = await internals.getCurrentStatus(ctx)

		if (current === undefined) {
			return await internals.showNoCurrentStateError()
		}

		const statusMessage = await internals.showMessagePicker(ctx)

		if (statusMessage === undefined) {
			return
		}

		const status = {
			message: statusMessage,
			online: current.online,
		}

		await api.setStatus(apiEndpoint, authOptions, status)
		await internals.setCurrentStatus(ctx, status)
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(tools.buildCommand("setup"), async () => {
		const apiEndpoint = await vscode.window.showInputBox({
			placeHolder: "https://rocket.example.com",
			prompt: "Base URL of the Rocket.Chat server",
			validateInput: (endpoint => {
				try {
					new URL(endpoint)
					return
				} catch (err: unknown) {
					return `${endpoint} is not a valid URL.`
				}
			}),
			value: await internals.getApiUrl(),
		})

		if (apiEndpoint === undefined) {
			return
		}

		await internals.setApiUrl(apiEndpoint)
	}))

	ctx.subscriptions.push(internals.statusBarItem)
}

export async function deactivate(): Promise<void> {
	return new Promise((resolve) => {
		return resolve()
	})
}
