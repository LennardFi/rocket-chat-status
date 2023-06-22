# Status message templates

Predefine statuses that can vary based on some dynamic values like the current
time or workspace details.

## Examples

### Directory names

`Working for {d+1,>kebab,^upWord,-" "}`: **Working for New Customer** Uses the
second last path part (`new-customer`) of the current workspace path (in this
example: `~/prj/new-customer/exciting-project`). This path part will be split by
every `-` character and every first letter of each part will be transformed to
uppercase.

### Git references

- `Testing app on
  [{g?branch}](https://github.com/UserOrCompany/MyProject/tree/{g?branch})}`:
  **Testing app on release-v1.4.2** Displays the current branch as a clickable
  link to the given remote.
- `Working on MyProject/{g?branch}`: **Working on MyProject/release-v1.3.4.0**
  Displays the current branch.

### Input

- `Meeting with {i}`: **Meeting with example company** Opens a VS Code input to
  set the value for `i`.
- `Meeting for {i~["15 minutes", "1 hour", "two hours"]}`: **Meeting for 1
  hour** Opens a VS Code input to set the value for `i`. The user **can** select
  from the values `15 minutes`, `1 hour`, `two hours`.
- `Meeting for {i=["15 minutes", "1 hour", "two hours"]}`: **Meeting with
  example company** Opens a VS Code input to set the value for `i`. The user
  **must** select from the values `15 minutes`, `1 hour`, `two hours`.

### Time

- `Lunch break till {t+1h,~5m,="[hh]:[mm]"}`: **Lunch break till 13:00** The time
  indicated corresponds to the time in one hour, rounded to the nearest 5
  minutes. The time is output in the format hh:mm.
- `AFK till {t+10m,~+5m,=iso}`: **AFK till 15:15** The time indicated
  corresponds to the time ten minutes, rounded up to the nearest 5 minutes. The
  time is output in the format hh-mm-ss.

## Reference

Use curly braces (`{` and `}`) and a keyword. You can mask the braces this way
when needed: `\{` or `\}`.

The most variables support modifiers. This modifiers will be separated by a
comma (`,`): `{t~5m,+1h}`

### Directory name `d`

By using this dynamic value you can use the name of VS Codes current workspace
directory (CWD) or its parent directories and display it in the status text.

#### Directory offset

By using the `+` modifier you can set a directory offset to use the name of a
parent directory instead of the CWD name. The modifier must be followed by an
integer.

Usage (CWD is `~/prj/customer/project`):

- `d+0`: "project"
- `d+1`: "customer"
- `d+2`: "prj"

#### Input word format

Use the `>` modifier to specify the format of the directory name. This will be
used to separate words in the directory name. The modifier must be followed by a
valid input format.

The following formats are valid:

| Format            | Example input |         |
| :---------------- | :------------ | :------ |
| `camel`, `pascal` | newApp        |         |
| `kebab`           | new-app       |         |
| `snake`           | new_app       |         |
| `space`           | new App       | default |
| `no-splitting`    | new App       |         |

In addition to their normal behavior, the `camel`, `pascal`, `kebab` and `snake`
modifiers also split the folder name at each whitespace.

If the `no-splitting` modifier value is used the [Output word joiner
modifier](#output-word-joiner) has no effect and the [Reformat word casing
modifier](#reformat-word-casing) uses the path part name since no words could be
separated.

#### Reformat word casing

This modifier determines how the casing of the path part name words will be
changed.

You can specify the output casing by using the `^` modifier. This modifier must
be followed by a valid casing format.

Valid formats (Input returns two words: "new" and "Customer"):

| Format              | output           | Notes                                                                  |
| :------------------ | :--------------- | :--------------------------------------------------------------------- |
| `low`               | "new" "customer" | Transform all letters to lowercase                                     |
| `unchanged`         | "new" "Customer" | Transforms nothing                                                     |
| `up`                | "NEW" "CUSTOMER" | Transform all letters to uppercase                                     |
| `upFirst`           | "New" "customer" | Transform the first letter to uppercase                                |
| `upWord`            | "New" "Customer" | Transform the first letter of every word to uppercase                  |
| `upWordExceptFirst` | "new" "Customer" | Transform the first letter of every except the first word to uppercase |

Without this modifier, the words are displayed in the same casing as shown in
the name of the path part.

#### Output word joiner

After splitting the path part name into words by using the [Input word format
modifier](#input-word-format) this modifier determines how all words will be
rejoined.

You can specify the output word join string by using the `-` modifier. This
modifier must be followed by the joining string surrounded by double quotes (`"`).

Usage (Input returns two words: "new" and "Customer"):

| Modifier definition | Output       |
| :------------------ | :----------- |
| `-" "`              | new Customer |
| `-"-"`              | new-Customer |
| `-""`               | newCustomer  |

Without this modifier, the words are rejoined using spaces.

### Git references `g`

You can display some git references like the current git branch.

> **Note:** Without the [reference type modifier](#reference-type) nothing will
> be displayed.

#### Reference type

By using the `?` you can decide which reference should be displayed:

| Modifier argument | Description                                          | Example                                |
| :---------------- | :--------------------------------------------------- | :------------------------------------- |
| `branch`          | Displays the name of the branch currently working on | for example `main` or `release-v1.4.2` |

### Input box `i`

Use the `i` variable to open a input box when using this template. The value
entered in the input box will be inserted in the status text.

#### Optional values selection modifier

Provide a list of options to speed up the input by using the `~` modifier. A
list of text options must following the `~` modifier. Every text option is
surrounded by double quotes (`"`). The options are separated by a comma (`,`).

Usage:

`{i~["internal", "quick"]} meeting` results in "internal meeting", "quick
meeting" or some other text followed by " meeting".

> **Note:** You cannot use the "Optional values selection modifier" when the
> "Mandatory values selection modifier" is already used.

#### Mandatory values selection modifier

Works like the [optional values selection
modifier](#optional-values-selection-modifier): Provide a list of options you
must select from by using the `=` modifier. A list of text options must
following the `=` modifier. Every text option is surrounded by double quotes
(`"`). The options are separated by a comma (`,`).

Usage:

`{i=["internal", "quick"]} meeting`: Only "internal meeting" or "quick meeting"
possible.

> **Note:** You cannot use the "Mandatory values selection modifier" when the
> "Optional values selection modifier" is already used.

### Time `t`

Without arguments the time variable uses the current time. If no format has been
given the `hh:mm` format will be used.

Multiple modifiers support time ranges as arguments. The time ranges have to be
in the format `xm` and `xh` while `x` has to be an integer.

#### Offset modifiers

Use `+` or `-` modifier followed by an hour and / or minute time offset to
change the time returned by the time variable.

Usage: (Current time is 3:03 pm / 15:03)

- `t+10m`: 3:13 pm / 15:13
- `t-1h`: 2:03 pm / 14:03
- `t+90m`: 4:33 pm / 16:33
- `t+1h50m`: 4:53 pm / 16:53

#### Round modifier

Use the `~` modifier to round the time to the nearest number depending on the
given rounding value. The modifier also supports only rounding down or up by
using the `+` or `-` after `~` modifier.

Usage: (Current time is 3:03 pm / 15:03)

- `t~5m`: 3:05 pm / 15:05
- `t~1h`: 3:00 pm / 15:00
- `t~-5m`: 3:00 pm / 15:00
- `t~+1h`: 4:00 pm / 16:00

#### Format modifier

Change the time output format by using the format modifier `=`.

This modifier expects an argument with the output format:

| Modifier argument | Output format                                     | Example  |
| :---------------- | :------------------------------------------------ | :------- |
| `iso`             | `[HH]-[MM]-00`                                    | 15-03-00 |
| `american`        | `[h]:[MM] [t]`                                    | 3:03 pm  |
| `german`          | `[HH]:[MM]`                                       | 15:03    |
| `...`             | Custom format. Output defined by the placeholders | 15 Uhr   |

The custom format supports the following arguments:

- `[HH]` hours with leading zero in 24 hour format
- `[H]` hours without leading zero in 24 hour format
- `[hh]` hours with leading zero in 12 hour format
- `[h]` hours without leading zero in 12 hour format
- `[MM]` minutes with leading zero
- `[M]` minutes without leading zero
- `[T]` AM / PM
- `[t]` am / pm

Every other characters in the format string will be displayed.
