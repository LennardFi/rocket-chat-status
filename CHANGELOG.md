# Change Log

## [Scheduled]

The following features may be added in the future:

- Check API for current status periodically and set the value in the extension
  global state if the downloaded status differs from the current value.

## [0.5.1] - 2021-10-11

### Added

- Added debug log for critical extension exceptions

## [0.5.0] - 2021-10-05

### Added

- Added debug log

### Changed

Updated dependencies

## [0.4.0] - 2021-07-14

### Changed

Updated dependencies

## [0.3.2] - 2021-07-14

### Changed

Fixed some bugs

## [0.3.1] - 2021-06-14

### Changed

Updated dependencies

## [0.3.0] - 2021-04-13

### Added

- Added `onlineStatusLabel` configuration to change the behavior of the label in
  the status bar.

### Changed

- By default, the online status label is now colored.

## [0.2.0] - 2021-04-12

### Changed

- Fixed a bug where the extension crashed when the credentials could not be
  loaded.
- Updated dependencies to the latest version

## [0.1.3] - 2021-03-25

### Added

- Added explicit type property for `rocket-chat-status.bookmarkedStatuses`
  config

### Changed

- Extended `README.md`
- Fixed typo in `README.md`

## [0.1.2] - 2021-03-24

### Changed

- Updated and added descriptions for the extension configurations.

## [0.1.1] - 2021-03-22

### Added

- Setup guide added to `README.md`

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
