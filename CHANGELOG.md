# Change Log

## [Unreleased]

The following features may be added in the future:

- Check API for current status periodically and set the value in the extension
  global state if the downloaded status differs from the current value.

## [0.1.0] - 2021-03-22

### Changed

- **Breaking change:** Renamed `rocket-chat-status.statusHistoryLimit` config to
  `rocket-chat-status.statusCacheLimit`
- Changed all labels containing the term "cache" to "history"
- Changed the description of the configuration
  `rocket-chat-status.statusHistoryLimit`
- Current status will be downloaded directly after successful login
- Renamed command "Delete status cache" to "Delete status history"
- Using new `CHANGELOG.md` file structure

## [0.0.1] - 2021-03-21

### Commands

- Added "Rocket.Chat Status: Bookmark current status"
- Added "Rocket.Chat Status: Delete status cache"
- Added "Rocket.Chat Status: Download status"
- Added "Rocket.Chat Status: Login"
- Added "Rocket.Chat Status: Logout"
- Added "Rocket.Chat Status: Set status"
- Added "Rocket.Chat Status: Set status message"
- Added "Rocket.Chat Status: Setup"
