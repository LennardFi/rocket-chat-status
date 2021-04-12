import { URL } from "url"
import * as vscode from "vscode"
import { buildCommand } from "./lib/tools"
import { RocketChatStatusProvider } from "./next/provider"

export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
	const provider = new RocketChatStatusProvider(ctx)

	ctx.subscriptions.push(vscode.commands.registerCommand(buildCommand("bookmarkCurrentStatus"), async () => {
		await provider.bookmarkCurrentStatus()
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(buildCommand("deleteData"), async () => {
		const deleteAction = "Delete"
		const result =
			await vscode.window
				.showInformationMessage("This operation will delete all stored data.", deleteAction)
		if (result === deleteAction) {
			await provider.deleteData()
		}
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(buildCommand("downloadStatus"), async () => {
		await provider.bookmarkCurrentStatus()
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(buildCommand("login"), async () => {
		await provider.checkIsReady(true)

		const apiUrl = await vscode.window.showInputBox({
			placeHolder: `e.g. "https://rocket.example.com"`,
			prompt: "Base URL of the Rocket.Chat server instance",
			validateInput: (url => {
				try {
					new URL(url)
					return undefined
				} catch (err: unknown) {
					return "Invalid URL"
				}
			})
		})

		if (apiUrl === undefined) {
			return
		}

		const user = await vscode.window.showInputBox({
			prompt: "Username or mail address",
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

		await provider.login(apiUrl, user, password)
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(buildCommand("logout"), async () => {
		await provider.logout()
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(buildCommand("setStatus"), async () => {
		const status = await provider.getStatus()

		// TODO: Not implemented
		throw new Error("Not implemented")
	}))

	ctx.subscriptions.push(vscode.commands.registerCommand(buildCommand("setStatusMessage"), async () => {
		// TODO: Not implemented
		throw new Error("Not implemented")
	}))
}

export async function deactivate(): Promise<void> {
	return new Promise((resolve) => {
		return resolve()
	})
}
