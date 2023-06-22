import * as path from "path"
import { Temporal } from "temporal-polyfill"
import * as vscode from "vscode"

import { GitExtension } from "./git"
import { buildError } from "./tools"

const TEMPLATE_DYNAMIC_VALUE_REGEXP = /(?<={)|(?<=})/
const TEMPLATE_DYNAMIC_VALUE_MODIFIER_SPLIT_REGEXP = /(?<!\\),/

// TEMPLATE DYNAMIC VALUE (TDV)
// "directory-name"
const TDV_DIR_OFFSET = 0
const TDV_DIR_INPUT_WORD_FORMAT: RCS.Templates.DirectoryNameInputWordFormat =
    "space"
const TDV_DIR_REFORMAT_WORD_CASING: RCS.Templates.DirectoryNameReformatWordCasing =
    "unchanged"
const TDV_DIR_OUTPUT_WORD_JOINER = " "
const TDV_DIR_ALLOWED_INPUT_WORD_FORMATS: string[] = [
    "camel",
    "kebab",
    "no-splitting",
    "pascal",
    "snake",
    "space",
] as RCS.Templates.DirectoryNameInputWordFormat[]
const TDV_DIR_ALLOWED_REFORMAT_WORD_CASING: string[] = [
    "low",
    "unchanged",
    "up",
    "upFirst",
    "upWord",
    "upWordExceptFirst",
] as RCS.Templates.DirectoryNameReformatWordCasing[]
// "git-reference"
const TDV_GIT_ALLOWED_REFERENCE_TYPE: string[] = [
    "branch",
    "commit",
] as RCS.Templates.GitReferenceType[]
// "input"
const TDV_INPUT_VALUES_SPLIT_REGEX = /(?<!\\);/
// "time"
const TDV_TIME_OFFSET = 0
const TDV_TIME_OFFSET_REGEX = /^[+-]?(\d+[hm])+/
const TDV_TIME_OFFSET_PREFIX_REGEX = /^[+-]?/
const TDV_TIME_OFFSET_HOURS_REGEX = /(\d+)h/
const TDV_TIME_OFFSET_MINUTES_REGEX = /(\d+)m/
const TDV_TIME_ROUND_PREFIX_REGEX = /^(\+|-)/
const TDV_TIME_ROUND: RCS.Templates.DynamicTimeValue["round"] = undefined
const TDV_TIME_FORMAT = "[HH]:[MM]"

export async function renderTemplateDynamicValue(
    value: RCS.Templates.DynamicTemplateValue
): Promise<string> {
    switch (value.type) {
        case "directory-name": {
            if (
                value.directoryOffset !== undefined &&
                (value.directoryOffset < 0 ||
                    !Number.isSafeInteger(value.directoryOffset))
            ) {
                throw buildError(
                    "internal",
                    "InvalidDynamicValue",
                    `The directory offset must be safe non-negative integer.`,
                    true
                )
            }

            const directoryPath = path.resolve(
                process.cwd(),
                "../".repeat(value.directoryOffset ?? TDV_DIR_OFFSET)
            )
            const elements = directoryPath.split(path.sep)
            const dirName = elements.pop() ?? ""

            if (dirName === "") {
                throw buildError(
                    "internal",
                    "InvalidDynamicValue",
                    `Could not resolve parent directory: "./${
                        value.directoryOffset === undefined
                            ? ""
                            : "../".repeat(value.directoryOffset)
                    }"`,
                    true
                )
            }

            let inputParts: string[] = []

            switch (value.inputWordFormat ?? TDV_DIR_INPUT_WORD_FORMAT) {
                case "camel":
                case "pascal": {
                    inputParts = dirName.split(/(?<=[A-Z])|\s/)
                    break
                }
                case "kebab": {
                    inputParts = dirName.split(/-|\s/)
                    break
                }
                case "snake": {
                    inputParts = dirName.split(/_|\s/)
                    break
                }
                case "space": {
                    inputParts = dirName.split(/\s/)
                    break
                }
                case "no-splitting": {
                    inputParts = [dirName]
                    break
                }
            }

            if (
                (value.reformatWordCasing ?? TDV_DIR_REFORMAT_WORD_CASING) !==
                "unchanged"
            ) {
                inputParts = inputParts.map((p) => p.toLowerCase())
            }

            let outputParts: string[] = []

            switch (value.reformatWordCasing ?? TDV_DIR_REFORMAT_WORD_CASING) {
                case "low": {
                    outputParts = inputParts.map((p) => p.toLowerCase())
                    break
                }
                case "unchanged": {
                    outputParts = inputParts
                    break
                }
                case "up": {
                    outputParts = inputParts.map((p) => p.toUpperCase())
                    break
                }
                case "upFirst": {
                    const [first, ...rest] = inputParts
                    outputParts = [
                        first
                            .split("")
                            .map((p, i) => {
                                if (i === 0) {
                                    return p.toUpperCase()
                                }
                                return p
                            })
                            .join(""),
                        ...rest,
                    ]
                    break
                }
                case "upWord": {
                    outputParts = inputParts.map((part) => {
                        const [first, ...rest] = part
                        return `${first.toUpperCase()}${rest.join("")}`
                    })
                    break
                }
                case "upWordExceptFirst": {
                    outputParts = inputParts.map((part, i) => {
                        if (i === 0) {
                            return part
                        }
                        const [first, ...rest] = part
                        return `${first.toUpperCase()}${rest.join("")}`
                    })
                    break
                }
            }

            return outputParts.join(
                value.outputWordJoiner ?? TDV_DIR_OUTPUT_WORD_JOINER
            )
        }
        case "git-reference": {
            const gitExtension =
                vscode.extensions.getExtension<GitExtension>("vscode.git")
            if (gitExtension === undefined) {
                throw buildError(
                    "internal",
                    "GitExtensionNotAvailable",
                    "Git extension not accessible.",
                    true
                )
            }

            if (!gitExtension.exports.enabled) {
                throw buildError(
                    "internal",
                    "GitExtensionNotAvailable",
                    "Git extension not enabled.",
                    true
                )
            }

            const gitApi = gitExtension.exports.getAPI(1)

            switch (value.referenceType) {
                case "branch": {
                    const branch = await gitApi.repositories[0].getBranch(
                        "HEAD"
                    )

                    if (branch.name === undefined) {
                        throw buildError(
                            "internal",
                            "GitExtensionError",
                            "Could not get branch name of HEAD",
                            true
                        )
                    }

                    return branch.name
                }
                case "commit": {
                    const commit = await gitApi.repositories[0].getCommit(
                        "HEAD"
                    )

                    return commit.hash.slice(0, 6)
                }
            }
        }
        // eslint-disable-next-line no-fallthrough
        case "input": {
            throw buildError(
                "internal",
                "NotImplemented",
                "DynamicTemplateValue not implemented",
                true
            )
        }
        case "time": {
            if (
                value.offset !== undefined &&
                !Number.isSafeInteger(value.offset)
            ) {
                throw buildError(
                    "internal",
                    "InvalidDynamicValue",
                    `Invalid time offset: ${value.offset}`,
                    true
                )
            }

            const currentTime = Temporal.Now.zonedDateTimeISO().add({
                seconds: value.offset ?? TDV_TIME_OFFSET,
            })
            const roundOptions = value.round ?? TDV_TIME_ROUND

            const roundedDate =
                roundOptions === undefined
                    ? currentTime
                    : currentTime.round({
                          smallestUnit: roundOptions[1],
                          roundingIncrement: roundOptions[0],
                          roundingMode:
                              roundOptions[2] === "down"
                                  ? "floor"
                                  : roundOptions[2] === "nearest"
                                  ? "halfExpand"
                                  : "ceil",
                      })

            return formatTime(roundedDate, value.format ?? TDV_TIME_FORMAT)
        }
    }
}

export function convertDynamicTemplateValue(
    dynamicTemplateValueString: string
): RCS.Templates.DynamicTemplateValue {
    const type = dynamicTemplateValueString.slice(0, 1)
    const modifiers = dynamicTemplateValueString
        .slice(1)
        .split(TEMPLATE_DYNAMIC_VALUE_MODIFIER_SPLIT_REGEXP)
        .map((s) => s.replace(/\\,/, ","))

    switch (type) {
        case "d": {
            return modifiers.reduce(
                (value, modifier) => {
                    const modifierIdentifier = modifier.slice(0, 1)
                    const modifierValue = modifier.slice(1)

                    switch (modifierIdentifier) {
                        case "+": {
                            if ("directoryOffset" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            const directoryOffset =
                                Number.parseInt(modifierValue)

                            if (isNaN(directoryOffset)) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `Invalid modifier value: "${modifier}". Modifier value has to be a non-negative integer.`,
                                    true
                                )
                            }

                            if (directoryOffset < 0) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `Invalid modifier value: "${modifier}". Modifier value has to be a non-negative integer.`,
                                    true
                                )
                            }

                            return {
                                ...value,
                                directoryOffset,
                            }
                        }
                        case ">": {
                            if ("inputWordFormat" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            if (
                                !TDV_DIR_ALLOWED_INPUT_WORD_FORMATS.includes(
                                    modifierValue
                                )
                            ) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `Invalid modifier value: "${modifier}". Valid values: ${TDV_DIR_ALLOWED_INPUT_WORD_FORMATS.map(
                                        (s) => `\\"${s}\\"`
                                    ).join(",")}`,
                                    true
                                )
                            }

                            return {
                                ...value,
                                inputWordFormat:
                                    modifierValue as RCS.Templates.DirectoryNameInputWordFormat,
                            }
                        }
                        case "^": {
                            if ("reformatWordCasing" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            if (
                                !TDV_DIR_ALLOWED_REFORMAT_WORD_CASING.includes(
                                    modifierValue
                                )
                            ) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `Invalid modifier value: "${modifier}". Valid values: ${TDV_DIR_ALLOWED_REFORMAT_WORD_CASING.map(
                                        (s) => `\\"${s}\\"`
                                    ).join(",")}`,
                                    true
                                )
                            }

                            return {
                                ...value,
                                reformatWordCasing:
                                    modifierValue as RCS.Templates.DirectoryNameReformatWordCasing,
                            }
                        }
                        case "-": {
                            if ("outputWordJoiner" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            return {
                                ...value,
                                outputWordJoiner: modifierValue,
                            }
                        }
                        default: {
                            throw buildError(
                                "user",
                                "InvalidDynamicValue",
                                `Invalid modifier identifier: ${modifierIdentifier}`,
                                true
                            )
                        }
                    }
                },
                {
                    type: "directory-name",
                } as RCS.Templates.DynamicDirectoryValue
            )
        }
        case "g": {
            const value = modifiers.reduce(
                (value, modifier) => {
                    const modifierIdentifier = modifier.slice(0, 1)
                    const modifierValue = modifier.slice(1)

                    switch (modifierIdentifier) {
                        case "?": {
                            if (
                                "referenceType" in value &&
                                value.referenceType !==
                                    ("" as RCS.Templates.GitReferenceType)
                            ) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            if (
                                !TDV_GIT_ALLOWED_REFERENCE_TYPE.includes(
                                    modifierValue
                                )
                            ) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `Invalid modifier value: "${modifier}". Valid values: ${TDV_GIT_ALLOWED_REFERENCE_TYPE.map(
                                        (s) => `\\"${s}\\"`
                                    ).join(",")}`,
                                    true
                                )
                            }

                            return {
                                ...value,
                                referenceType:
                                    modifierValue as RCS.Templates.GitReferenceType,
                            }
                        }
                        default: {
                            throw buildError(
                                "user",
                                "InvalidDynamicValue",
                                `Invalid modifier identifier: ${modifierIdentifier}`,
                                true
                            )
                        }
                    }
                },
                {
                    type: "git-reference",
                    referenceType: "" as RCS.Templates.GitReferenceType,
                } as RCS.Templates.DynamicGitReferenceValue
            )

            if (value.referenceType === undefined) {
                throw buildError(
                    "user",
                    "InvalidDynamicValue",
                    `Reference type modifier in dynamic value required`
                )
            }

            return value
        }
        case "i": {
            return modifiers.reduce(
                (value, modifier) => {
                    const modifierIdentifier = modifier.slice(0, 1)
                    const modifierValue = modifier.slice(1)

                    switch (modifierIdentifier) {
                        case "~": {
                            if ("optionalValues" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            if ("mandatoryValues" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `Cannot use "${modifierIdentifier}" when "=" modifier is already defined`,
                                    true
                                )
                            }

                            const optionalValues = modifierValue
                                .split(TDV_INPUT_VALUES_SPLIT_REGEX)
                                .map((s) => s.replace(/\\;/g, ";"))

                            return {
                                ...value,
                                optionalValues,
                            }
                        }
                        case "=": {
                            if ("mandatoryValues" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            if ("optionalValues" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `Cannot use "${modifierIdentifier}" when "~" modifier is already defined`,
                                    true
                                )
                            }

                            const mandatoryValues = modifierValue
                                .split(TDV_INPUT_VALUES_SPLIT_REGEX)
                                .map((s) => s.replace(/\\;/g, ";"))

                            return {
                                ...value,
                                mandatoryValues,
                            }
                        }
                        default: {
                            throw buildError(
                                "user",
                                "InvalidDynamicValue",
                                `Invalid modifier identifier: ${modifierIdentifier}`,
                                true
                            )
                        }
                    }
                },
                {
                    type: "input",
                } as RCS.Templates.DynamicInputValue
            )
        }
        case "t": {
            return modifiers.reduce(
                (value, modifier) => {
                    const modifierIdentifier = modifier.slice(0, 1)
                    const modifierValue = modifier.slice(1)

                    switch (modifierIdentifier) {
                        case "+":
                        case "-": {
                            if ("offset" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            try {
                                const timeRange = parseTimeRange(modifier)

                                const seconds =
                                    (timeRange.hours ?? 0) * 60 * 60 +
                                    (timeRange.minutes ?? 0) * 60

                                return {
                                    ...value,
                                    offset: seconds,
                                }
                            } catch (e: unknown) {
                                if (
                                    typeof e === "object" &&
                                    e !== null &&
                                    "type" in e &&
                                    (e as { type: unknown }).type ===
                                        "RocketChatStatusException"
                                ) {
                                    throw e
                                }

                                if (e instanceof Error) {
                                    throw buildError(
                                        "internal",
                                        "UnknownError",
                                        `Unknown error while converting dynamic template value. Internal error: [${
                                            e.name
                                        }] ${e.message}\n${e.stack ?? ""}`
                                    )
                                }

                                throw buildError(
                                    "internal",
                                    "UnknownError",
                                    `Unknown error while converting dynamic template value: ${JSON.stringify(
                                        e
                                    )}`
                                )
                            }
                        }
                        case "~": {
                            if ("round" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            const roundPrefix =
                                TDV_TIME_ROUND_PREFIX_REGEX.exec(modifierValue)
                                    ? modifierValue.slice(0, 1)
                                    : undefined

                            const roundDirection: RCS.Templates.RoundDirection =
                                roundPrefix === undefined
                                    ? "nearest"
                                    : roundPrefix === "+"
                                    ? "up"
                                    : "down"

                            const roundTimeRange = parseTimeRange(
                                roundPrefix === undefined
                                    ? modifierValue
                                    : modifierValue.slice(1)
                            )

                            console.log({ modifierValue, roundTimeRange })

                            if (
                                roundTimeRange.hours === undefined &&
                                roundTimeRange.minutes !== undefined
                            ) {
                                return {
                                    ...value,
                                    round: [
                                        roundTimeRange.minutes,
                                        "minutes",
                                        roundDirection,
                                    ],
                                }
                            }

                            if (
                                roundTimeRange.hours !== undefined &&
                                roundTimeRange.minutes === undefined
                            ) {
                                return {
                                    ...value,
                                    round: [
                                        roundTimeRange.hours,
                                        "hours",
                                        roundDirection,
                                    ],
                                }
                            }

                            throw buildError(
                                "internal",
                                "InvalidDynamicValue",
                                `Invalid time range: ${modifierValue}`
                            )
                        }
                        case "=": {
                            if ("format" in value) {
                                throw buildError(
                                    "user",
                                    "InvalidDynamicValue",
                                    `"${modifierIdentifier}" modifier already defined`,
                                    true
                                )
                            }

                            switch (modifierValue) {
                                case "iso":
                                    return {
                                        ...value,
                                        format: `[HH]-[MM]-00`,
                                    }
                                case "american":
                                    return {
                                        ...value,
                                        format: `[h]:[MM] [t]`,
                                    }
                                case "german":
                                    return {
                                        ...value,
                                        format: `[HH]:[MM]`,
                                    }
                                default: {
                                    return {
                                        ...value,
                                        format: modifierValue,
                                    }
                                }
                            }
                        }
                        default: {
                            throw buildError(
                                "user",
                                "InvalidDynamicValue",
                                `Invalid modifier identifier: ${modifierIdentifier}`,
                                true
                            )
                        }
                    }
                },
                {
                    type: "time",
                } as RCS.Templates.DynamicTimeValue
            )
        }
        default: {
            throw buildError(
                "internal",
                "InvalidDynamicValue",
                `Invalid dynamic value type: ${type}`
            )
        }
    }
}

export function splitTemplateString(
    template: string | RCS.Templates.Template
): RCS.Templates.StatusMessageContent[] {
    if (typeof template !== "string") {
        return splitTemplateString(template.message)
    }

    return template.split(TEMPLATE_DYNAMIC_VALUE_REGEXP).reduce((acc, next) => {
        if (acc.length === 0) {
            return [next]
        }

        const lastPart = acc[acc.length - 1]

        if (typeof lastPart === "string" && lastPart.endsWith("\\")) {
            return [...acc.slice(0, -1), `${lastPart}${next}`]
        }
        if (typeof lastPart === "string" && lastPart.endsWith("}")) {
            throw buildError(
                "internal",
                "InvalidTemplateString",
                `Template string ${template} contains unexpected character`,
                true
            )
        }
        if (typeof lastPart === "string" && lastPart.endsWith("{")) {
            return [...acc, convertDynamicTemplateValue(next.slice(0, -1))]
        }

        return [...acc, next]
    }, [] as RCS.Templates.StatusMessageContent[])
}

export async function renderTemplateString(
    template: string | RCS.Templates.Template
): Promise<string> {
    const parts = splitTemplateString(template)

    let output = ""

    for (const part of parts) {
        if (typeof part === "string") {
            output += part
            continue
        }

        output += await renderTemplateDynamicValue(part)
    }

    return output
}

/**
 * Tries to parse the time offset in the given string.
 * @returns Absolute time offset in seconds
 * @param timeRangeString The string which contains the time offset.
 */
export function parseTimeRange(
    timeRangeString: string
): RCS.Templates.TimeRange {
    if (!TDV_TIME_OFFSET_REGEX.exec(timeRangeString)) {
        throw buildError(
            "internal",
            "ParseInvalidTimeRange",
            `Invalid time range: ${timeRangeString}`,
            true
        )
    }

    const prefix = TDV_TIME_OFFSET_PREFIX_REGEX.exec(timeRangeString)?.[0] ?? ""
    const hoursString = TDV_TIME_OFFSET_HOURS_REGEX.exec(timeRangeString)?.[1]
    const minutesString =
        TDV_TIME_OFFSET_MINUTES_REGEX.exec(timeRangeString)?.[1]

    if (hoursString === undefined && minutesString === undefined) {
        throw buildError(
            "internal",
            "InvalidDynamicValue",
            `Could not parse time range from "${timeRangeString}"`
        )
    }

    return {
        hours:
            hoursString === undefined
                ? undefined
                : Number.parseInt(prefix + hoursString),
        minutes:
            minutesString === undefined
                ? undefined
                : Number.parseInt(prefix + minutesString),
    }
}

export function formatTime(
    date: Temporal.ZonedDateTime,
    outputFormat: string
): string {
    return outputFormat
        .replace("[HH]", date.hour.toString().padStart(2, "0"))
        .replace("[H]", date.hour.toString())
        .replace("[hh]", (date.hour % 12 || 12).toString().padStart(2, "0"))
        .replace("[h]", (date.hour % 12 || 12).toString())
        .replace("[MM]", date.minute.toString().padStart(2, "0"))
        .replace("[M]", date.minute.toString())
        .replace("[T]", date.hour >= 12 ? "PM" : "AM")
        .replace("[t]", date.hour >= 12 ? "pm" : "am")
}
