import { Temporal } from "temporal-polyfill"
import * as vscode from "vscode"

export default class OutputChannel {
    outputChannel: vscode.OutputChannel

    constructor() {
        this.outputChannel =
            vscode.window.createOutputChannel("Rocket.Chat Status")
    }

    private static outputSymbol(type: RCS.Logging.LoggingType): string {
        return type === "debug"
            ? `🚩`
            : type === "error"
            ? `❌`
            : type === "info"
            ? `ℹ️`
            : `⚠️`
    }

    public log(
        msg: string,
        type: RCS.Logging.LoggingType,
        showOutputChannel?: boolean
    ): void {
        if (type === "debug" && !DEV_RELEASE) {
            return
        }

        this.outputChannel.appendLine(
            `${OutputChannel.outputSymbol(
                type
            )} ${Temporal.Now.zonedDateTimeISO().toString()}:\t${msg}`
        )

        if (showOutputChannel) {
            this.outputChannel.show()
        }
    }

    public logException(error: RCS.Error.Exception): void {
        const type: RCS.Logging.LoggingType =
            error.scope === "debug" ? "debug" : "error"

        this.outputChannel.appendLine(
            `${OutputChannel.outputSymbol(
                type
            )} ${Temporal.Now.zonedDateTimeISO().toString()}:\t${
                error.code !== undefined ? `[${error.code}] ` : ""
            }${error.msg ?? ""}`
        )

        if (error.scope === "internal") {
            const e = new Error()
            this.outputChannel.appendLine(
                (e.stack ?? "").split("\n").join("\n\t\t")
            )
        }

        if (error.showOutputChannel) {
            this.outputChannel.show()
        }
    }
}
