# Status Label Format

The format is defined in a string with placeholders. The following placeholder
are supported and each can be used multiple times.

|           Placeholder            | Note                                                                                  |
| :------------------------------: | :------------------------------------------------------------------------------------ |
|  `{colorBegin}` , `{colorEnd}`   | Colorize the content between both placeholders with the color of the status.          |
| `{label}`, `{Label}` , `{LABEL}` | Display the status as text ("online", "offline", "busy" and "away") different casings |
|             `{msg}`              | Insert the message of the current status.                                             |
|             `{icon}`             | Inserts the icon associated with the current status.                                  |
|   e.g. `{:rocket:}`, `:fire:`    | Use the colon notation to insert a vscode icon.                                       |

For example:

`{colorBegin}{msg}{colorEnd}` displays the message in the color of the current
status.
