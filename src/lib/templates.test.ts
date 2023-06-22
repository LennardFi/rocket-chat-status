import path = require("path")
import { Temporal } from "temporal-polyfill"
import * as vscode from "vscode"
import { API, Branch, GitExtension, RefType } from "./git"
import {
    convertDynamicTemplateValue,
    renderTemplateDynamicValue,
} from "./templates"

jest.spyOn(vscode.extensions, "getExtension").mockReturnValue({
    exports: {
        getAPI(): ReturnType<GitExtension["getAPI"]> {
            return {
                repositories: [
                    {
                        async getBranch(ref): Promise<Branch> {
                            if (ref === "HEAD") {
                                return {
                                    type: RefType.Head,
                                    name: "main",
                                }
                            }

                            return {
                                type: RefType.Head,
                                name: "main",
                            }
                        },
                    },
                ],
            } as API
        },
    },
} as vscode.Extension<unknown>)

jest.spyOn(process, "cwd").mockReturnValue(path.dirname(__filename))

describe("renderTemplateDynamicValue", () => {
    describe("directory-name", () => {
        describe("no modifier", () => {
            test("[RESULT] runs without modifiers", async () => {
                expect(
                    await renderTemplateDynamicValue({ type: "directory-name" })
                ).toBe("lib")
            })
        })
        describe("directory offset", () => {
            test("[RESULT] valid offset", async () => {
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 0,
                    })
                ).toBe("lib")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 1,
                    })
                ).toBe("src")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                    })
                ).toBe("rocket-chat-status")
            })
            test("[ERROR] negative offset", async () => {
                await expect(
                    renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: -1,
                    })
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
            test("[ERROR] to high offset", async () => {
                await expect(
                    renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2048,
                    })
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
            test("[ERROR] infinite offset", async () => {
                await expect(
                    renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: Infinity,
                    })
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
        describe("input word format", () => {
            test("[RESULT] correct format", async () => {
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "camel",
                    })
                ).toBe("rocket-chat-status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                    })
                ).toBe("rocket chat status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "no-splitting",
                    })
                ).toBe("rocket-chat-status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "pascal",
                    })
                ).toBe("rocket-chat-status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "snake",
                    })
                ).toBe("rocket-chat-status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "space",
                    })
                ).toBe("rocket-chat-status")
            })
        })
        describe("reformat word casing", () => {
            test("[RESULT] valid reformat word casing", async () => {
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "low",
                    })
                ).toBe("rocket chat status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "unchanged",
                    })
                ).toBe("rocket chat status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "up",
                    })
                ).toBe("ROCKET CHAT STATUS")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "upFirst",
                    })
                ).toBe("Rocket chat status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "upWord",
                    })
                ).toBe("Rocket Chat Status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "upWordExceptFirst",
                    })
                ).toBe("rocket Chat Status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        reformatWordCasing: "upWordExceptFirst",
                    })
                ).toBe("rocket-chat-status")
            })
        })
        describe("output word joiner", () => {
            test("[RESULT] valid word joiner", async () => {
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "upWordExceptFirst",
                        outputWordJoiner: "",
                    })
                ).toBe("rocketChatStatus")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "upWord",
                        outputWordJoiner: " ",
                    })
                ).toBe("Rocket Chat Status")
                expect(
                    await renderTemplateDynamicValue({
                        type: "directory-name",
                        directoryOffset: 2,
                        inputWordFormat: "kebab",
                        reformatWordCasing: "upWord",
                        outputWordJoiner: "",
                    })
                ).toBe("RocketChatStatus")
            })
        })
    })
    // TODO: Not implemented
    // describe("git-reference", () => {
    //     test("renders with reference type", async () => {
    //         expect(
    //             await renderTemplateDynamicValue({
    //                 type: "git-reference",
    //                 referenceType: "branch",
    //             })
    //         ).toBe("main")
    //         expect(
    //             await renderTemplateDynamicValue({
    //                 type: "git-reference",
    //                 referenceType: "commit",
    //             })
    //         ).toBe(
    //             "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    //         )
    //     })
    // })

    // describe("input", () => {
    //     test("renders without modifiers", async () => {
    //         expect(
    //             await renderTemplateDynamicValue({
    //                 type: "input",
    //             })
    //         ).toBe("main")
    //         expect(
    //             await renderTemplateDynamicValue({
    //                 type: "git-reference",
    //                 referenceType: "commit",
    //             })
    //         ).toBe("main")
    //     })
    // })
    // describe("input", () => {
    //     test("renders with reference type", async () => {
    //         expect(
    //             await renderTemplateDynamicValue({
    //                 type: "git-reference",
    //                 referenceType: "branch",
    //             })
    //         ).toBe("main")
    //         expect(
    //             await renderTemplateDynamicValue({
    //                 type: "git-reference",
    //                 referenceType: "commit",
    //             })
    //         ).toBe(
    //             "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    //         )
    //     })
    // })
    // describe("input", () => {
    //     test("renders without modifiers", async () => {
    //         expect(
    //             await renderTemplateDynamicValue({
    //                 type: "input",
    //             })
    //         ).toBe("main")
    //         expect(
    //             await renderTemplateDynamicValue({
    //                 type: "git-reference",
    //                 referenceType: "commit",
    //             })
    //         ).toBe("main")
    //     })
    // })
    describe("time", () => {
        let timeStamp = Temporal.Now.zonedDateTimeISO().round("minute")
        beforeEach(() => {
            timeStamp = Temporal.Now.zonedDateTimeISO()
        })
        describe("no modifier", () => {
            test("[RESULT] runs without modifier", async () => {
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                    })
                ).toBe(
                    `${timeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${timeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
            })
        })
        describe("format", () => {
            test("[RESULT] Correct variable replacement", async () => {
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        format: "[HH] [H] [hh] [h] [MM] [M] [T] [t]",
                    })
                ).toBe(
                    `${timeStamp.hour
                        .toString()
                        .padStart(2, "0")} ${timeStamp.hour.toString()} ${(
                        timeStamp.hour % 12 || 12
                    )
                        .toString()
                        .padStart(2, "0")} ${(
                        timeStamp.hour % 12 || 12
                    ).toString()} ${timeStamp.minute
                        .toString()
                        .padStart(2, "0")} ${timeStamp.minute.toString()} ${
                        timeStamp.hour >= 12 ? "PM" : "AM"
                    } ${timeStamp.hour >= 12 ? "pm" : "am"}`
                )
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        format: "[HH][]][[Hh]",
                    })
                ).toBe(`${timeStamp.hour.toString().padStart(2, "0")}[]][[Hh]`)
            })
        })
        describe("round", () => {
            test(`[RESULT] 1 minute`, async () => {
                timeStamp = Temporal.Now.zonedDateTimeISO()
                const halfExpandTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 1,
                    roundingMode: "halfExpand",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [1, "minutes", "nearest"],
                    })
                ).toBe(
                    `${halfExpandTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${halfExpandTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                timeStamp = Temporal.Now.zonedDateTimeISO()
                const ceilTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 1,
                    roundingMode: "ceil",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [1, "minutes", "up"],
                    })
                ).toBe(
                    `${ceilTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${ceilTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                timeStamp = Temporal.Now.zonedDateTimeISO()
                const floorTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 1,
                    roundingMode: "floor",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [1, "minutes", "down"],
                    })
                ).toBe(
                    `${floorTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${floorTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
            })
            test(`[RESULT] 5 minutes`, async () => {
                const halfExpandTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 5,
                    roundingMode: "halfExpand",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [5, "minutes", "nearest"],
                    })
                ).toBe(
                    `${halfExpandTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${halfExpandTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                const ceilTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 5,
                    roundingMode: "ceil",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [5, "minutes", "up"],
                    })
                ).toBe(
                    `${ceilTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${ceilTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                const floorTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 5,
                    roundingMode: "floor",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [5, "minutes", "down"],
                    })
                ).toBe(
                    `${floorTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${floorTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
            })
            test(`[RESULT] 30 minutes`, async () => {
                const halfExpandTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 30,
                    roundingMode: "halfExpand",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [30, "minutes", "nearest"],
                    })
                ).toBe(
                    `${halfExpandTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${halfExpandTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                const ceilTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 30,
                    roundingMode: "ceil",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [30, "minutes", "up"],
                    })
                ).toBe(
                    `${ceilTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${ceilTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                const floorTimeStamp = timeStamp.round({
                    smallestUnit: "minute",
                    roundingIncrement: 30,
                    roundingMode: "floor",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [30, "minutes", "down"],
                    })
                ).toBe(
                    `${floorTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${floorTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
            })
            test(`[RESULT] 1 hour`, async () => {
                const halfExpandTimeStamp = timeStamp.round({
                    smallestUnit: "hour",
                    roundingIncrement: 1,
                    roundingMode: "halfExpand",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [1, "hours", "nearest"],
                    })
                ).toBe(
                    `${halfExpandTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${halfExpandTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                const ceilTimeStamp = timeStamp.round({
                    smallestUnit: "hour",
                    roundingIncrement: 1,
                    roundingMode: "ceil",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [1, "hours", "up"],
                    })
                ).toBe(
                    `${ceilTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${ceilTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                const floorTimeStamp = timeStamp.round({
                    smallestUnit: "hour",
                    roundingIncrement: 1,
                    roundingMode: "floor",
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        round: [1, "hours", "down"],
                    })
                ).toBe(
                    `${floorTimeStamp.hour
                        .toString()
                        .padStart(2, "0")}:${floorTimeStamp.minute
                        .toString()
                        .padStart(2, "0")}`
                )
            })
            test(`[ERROR] Requires minimal unit`, async () => {
                await expect(
                    renderTemplateDynamicValue({
                        type: "time",
                        round: [60, "minutes", "up"],
                    })
                ).rejects.toThrow()
            })
        })
        describe("offset", () => {
            test(`[RESULT] valid offset`, async () => {
                const oneMinuteOffset = timeStamp.add({
                    seconds: 60,
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        offset: 60,
                    })
                ).toBe(
                    `${oneMinuteOffset.hour
                        .toString()
                        .padStart(2, "0")}:${oneMinuteOffset.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                const fiveMinuteOffset = timeStamp.add({
                    seconds: 5 * 60,
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        offset: 5 * 60,
                    })
                ).toBe(
                    `${fiveMinuteOffset.hour
                        .toString()
                        .padStart(2, "0")}:${fiveMinuteOffset.minute
                        .toString()
                        .padStart(2, "0")}`
                )
                const oneHourOffset = timeStamp.add({
                    seconds: 60 * 60,
                })
                expect(
                    await renderTemplateDynamicValue({
                        type: "time",
                        offset: 60 * 60,
                    })
                ).toBe(
                    `${oneHourOffset.hour
                        .toString()
                        .padStart(2, "0")}:${oneHourOffset.minute
                        .toString()
                        .padStart(2, "0")}`
                )
            })
            test("[ERROR] Invalid offset", async () => {
                await expect(
                    renderTemplateDynamicValue({
                        type: "time",
                        offset: Infinity,
                    })
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
    })
})

describe("convertDynamicTemplateValue", () => {
    describe("directory-name", () => {
        describe("directory offset", () => {
            test("[RESULT] valid offset", async () => {
                expect(convertDynamicTemplateValue("d+1")).toStrictEqual({
                    type: "directory-name",
                    directoryOffset: 1,
                } as RCS.Templates.DynamicTemplateValue)
                expect(convertDynamicTemplateValue("d+2")).toStrictEqual({
                    type: "directory-name",
                    directoryOffset: 2,
                } as RCS.Templates.DynamicTemplateValue)
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("d+1,+1")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
            test("[ERROR] non-integer offset", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("d+abc")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
            test("[ERROR] negative offset throws error", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("d+-1")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
        describe("input word format", () => {
            test("[RESULT] valid format", async () => {
                expect(
                    convertDynamicTemplateValue("d>camel")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    inputWordFormat: "camel",
                })
                expect(
                    convertDynamicTemplateValue("d>kebab")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    inputWordFormat: "kebab",
                })
                expect(
                    convertDynamicTemplateValue("d>no-splitting")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    inputWordFormat: "no-splitting",
                })
                expect(
                    convertDynamicTemplateValue("d>pascal")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    inputWordFormat: "pascal",
                })
                expect(
                    convertDynamicTemplateValue("d>snake")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    inputWordFormat: "snake",
                })
                expect(
                    convertDynamicTemplateValue("d>space")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    inputWordFormat: "space",
                })
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("d>camel>camel")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
            test("[ERROR] invalid input word format", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("d>foo")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
        describe("reformat word casing", () => {
            test("[RESULT] valid format", async () => {
                expect(
                    convertDynamicTemplateValue("d^low")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    reformatWordCasing: "low",
                })
                expect(
                    convertDynamicTemplateValue("d^unchanged")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    reformatWordCasing: "unchanged",
                })
                expect(
                    convertDynamicTemplateValue("d^up")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    reformatWordCasing: "up",
                })
                expect(
                    convertDynamicTemplateValue("d^upFirst")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    reformatWordCasing: "upFirst",
                })
                expect(
                    convertDynamicTemplateValue("d^upWord")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    reformatWordCasing: "upWord",
                })
                expect(
                    convertDynamicTemplateValue("d^upWordExceptFirst")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    reformatWordCasing: "upWordExceptFirst",
                })
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("d^low,^low")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
            test("[ERROR] invalid reformat word casing", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("d^foo")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
        describe("output word joiner", () => {
            test("[RESULT] valid format", async () => {
                expect(
                    convertDynamicTemplateValue("d- ")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    outputWordJoiner: " ",
                })
                expect(
                    convertDynamicTemplateValue("d--")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    outputWordJoiner: "-",
                })
                expect(
                    convertDynamicTemplateValue("d-.")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    outputWordJoiner: ".",
                })
            })
            test("[RESULT] supports escape character", async () => {
                expect(
                    convertDynamicTemplateValue("d-\\,")
                ).toStrictEqual<RCS.Templates.DynamicDirectoryValue>({
                    type: "directory-name",
                    outputWordJoiner: ",",
                })
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("d- ,-.")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
    })
    describe("git", () => {
        describe("reference type", () => {
            test("[RESULT] valid format", async () => {
                expect(convertDynamicTemplateValue("g?branch")).toStrictEqual({
                    type: "git-reference",
                    referenceType: "branch",
                })
                expect(convertDynamicTemplateValue("g?commit")).toStrictEqual({
                    type: "git-reference",
                    referenceType: "commit",
                })
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("g?commit,?branch")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
    })
    describe("input", () => {
        describe("mandatory values", () => {
            test("[RESULT] valid format", async () => {
                expect(convertDynamicTemplateValue("i=foo")).toStrictEqual({
                    type: "input",
                    mandatoryValues: ["foo"],
                })
                expect(convertDynamicTemplateValue("i=foo;bar")).toStrictEqual({
                    type: "input",
                    mandatoryValues: ["foo", "bar"],
                })
            })
            test("[RESULT] supports escape characters", async () => {
                expect(
                    convertDynamicTemplateValue("i=f\\;o\\;o;bar")
                ).toStrictEqual({
                    type: "input",
                    mandatoryValues: ["f;o;o", "bar"],
                })
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("i=foo,=bar")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
            test("[ERROR] also used optional modifier", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("i=foo,~bar")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
        describe("optional values", () => {
            test("[RESULT] valid format", async () => {
                expect(convertDynamicTemplateValue("i~foo")).toStrictEqual({
                    type: "input",
                    optionalValues: ["foo"],
                })
                expect(convertDynamicTemplateValue("i~foo;bar")).toStrictEqual({
                    type: "input",
                    optionalValues: ["foo", "bar"],
                })
            })
            test("[RESULT] supports escape characters", async () => {
                expect(
                    convertDynamicTemplateValue("i~f\\;o\\;o;bar")
                ).toStrictEqual({
                    type: "input",
                    optionalValues: ["f;o;o", "bar"],
                })
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("i~foo,~bar")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
            test("[ERROR] also used mandatory modifier", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("i~foo,=bar")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
    })
    describe("time", () => {
        describe("offset", () => {
            test("[RESULT] valid format", async () => {
                expect(convertDynamicTemplateValue("t-120m")).toStrictEqual({
                    type: "time",
                    offset: -7200,
                })
                expect(convertDynamicTemplateValue("t-1h1m")).toStrictEqual({
                    type: "time",
                    offset: -3660,
                })
                expect(convertDynamicTemplateValue("t-1h")).toStrictEqual({
                    type: "time",
                    offset: -3600,
                })
                expect(convertDynamicTemplateValue("t-1m")).toStrictEqual({
                    type: "time",
                    offset: -60,
                })
                expect(convertDynamicTemplateValue("t-0m")).toStrictEqual({
                    type: "time",
                    offset: 0,
                })
                expect(convertDynamicTemplateValue("t+0m")).toStrictEqual({
                    type: "time",
                    offset: 0,
                })
                expect(convertDynamicTemplateValue("t+1m")).toStrictEqual({
                    type: "time",
                    offset: 60,
                })
                expect(convertDynamicTemplateValue("t+1h")).toStrictEqual({
                    type: "time",
                    offset: 3600,
                })
                expect(convertDynamicTemplateValue("t+1h1m")).toStrictEqual({
                    type: "time",
                    offset: 3660,
                })
                expect(convertDynamicTemplateValue("t+120m")).toStrictEqual({
                    type: "time",
                    offset: 7200,
                })
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("t+1h,+1m")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
                await expect(async () =>
                    convertDynamicTemplateValue("t+1h,-1m")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
                await expect(async () =>
                    convertDynamicTemplateValue("t-1h,-1m")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
        describe("round", () => {
            test("[RESULT] valid format", async () => {
                expect(convertDynamicTemplateValue("t~1m")).toStrictEqual({
                    type: "time",
                    round: [1, "minutes", "nearest"],
                } as RCS.Templates.DynamicTimeValue)
                expect(convertDynamicTemplateValue("t~5m")).toStrictEqual({
                    type: "time",
                    round: [5, "minutes", "nearest"],
                } as RCS.Templates.DynamicTimeValue)
                expect(convertDynamicTemplateValue("t~1h")).toStrictEqual({
                    type: "time",
                    round: [1, "hours", "nearest"],
                } as RCS.Templates.DynamicTimeValue)
                expect(convertDynamicTemplateValue("t~-1h")).toStrictEqual({
                    type: "time",
                    round: [1, "hours", "down"],
                } as RCS.Templates.DynamicTimeValue)
                expect(convertDynamicTemplateValue("t~+1h")).toStrictEqual({
                    type: "time",
                    round: [1, "hours", "up"],
                } as RCS.Templates.DynamicTimeValue)
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("t~1m,~1h")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
        describe("format", () => {
            test("[RESULT] valid format", async () => {
                expect(convertDynamicTemplateValue("t=abc")).toStrictEqual({
                    type: "time",
                    format: "abc",
                } as RCS.Templates.DynamicTimeValue)
                expect(convertDynamicTemplateValue("t=iso")).toStrictEqual({
                    type: "time",
                    format: "[HH]-[MM]-00",
                } as RCS.Templates.DynamicTimeValue)
                expect(
                    convertDynamicTemplateValue("t=[HH]-[MM]\\[HH]")
                ).toStrictEqual({
                    type: "time",
                    format: "[HH]-[MM]\\[HH]",
                } as RCS.Templates.DynamicTimeValue)
            })
            test("[ERROR] modifier used multiple times", async () => {
                await expect(async () =>
                    convertDynamicTemplateValue("t=iso,=german")
                ).rejects.toHaveProperty("type", "RocketChatStatusException")
            })
        })
    })
})
