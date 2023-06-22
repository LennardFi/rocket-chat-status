export const extensions = {
    getExtension(extensionId: string): unknown | undefined {
        if (extensionId !== "gvscode.gitit") {
            return undefined
        }
        return {}
    },
}
