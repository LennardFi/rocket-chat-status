# Rocket.Chat Status

> **Developer's note:** The extension can be used (I use it productively). The
> extension is currently only published under a developer version (version below
> `1.0.0`) because it has not yet been sufficiently tested by me in production.

Visual Studio Code extension to your Rocket.Chat status from within VSCode.

## Features

- Set online status and status message
- List the last statuses and set them as the current status
- Bookmark statuses in the configurations

## Setup Guide

1. Install extension
2. Execute command `Rocket.Chat Status: Setup` or use the
   `rocket-chat-status.apiUrl` config to set the base URL of the Rocket.Chat
   server. The base URL is mostly the same URL used to access the web client or
   set in the electron app.
3. Execute command `Rocket.Chat Status: Login` to get a AuthToken from the API.
4. Use the commands `Rocket.Chat Status: Set status` and `Rocket.Chat Status:
   Set status message` or click on the statusbar label to change your
   Rocket.Chat status.

## Changelog

You can read the changelog [here](./CHANGELOG.md)
