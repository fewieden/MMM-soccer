# MMM-soccer Changelog

## [Unreleased]

### Fixed

- [Switching to v4 due to empty tables in v2 of the API](https://github.com/fewieden/MMM-soccer/issues/70)

### Added

### Changed

### Removed

## [2.2.1]

### Fixed

* [Nunjuck template was rendering one team less than specified in config](https://github.com/fewieden/MMM-soccer/issues/39)

## [2.2.0]

**Update requires installation of dependencies refer to readme file!**

### Fixed

* Max teams showed in some occasions 1 team too much.

### Added

* Github actions (building and changelog)
* Dependency `node-fetch`
* Automated tests for node_helper and module
* Code coverage
* Codecov report

### Removed

* Travis integration
* Dependency `request`

## [2.1.1]

### Added

* JSDoc dependency
* package-lock.json

### Changed

* Travis config
* Updated eslint
* Updated config

### Fixed

* Linting issues

## [2.1.0]

**Requires version >= 2.14 of MagicMirror!**

### Added

* Integrated [MMM-Modal](https://github.com/fewieden/MMM-Modal)

### Changed

* Using remote logos
* Preview pictures

### Fixed

* Fade effect
* Focus_on in modal highlights correct team
* Help modal shows correct voice commands

### Removed

* Logo downloader
* Doclet integration

## [2.0.1]

### Added

* French translations (Thanks to [Laventin85](https://github.com/laventin85))

### Changed

* Readme config example
* Github config files

## [2.0.0]

### Added

* Club logo downloader
* New config option `logos`.
* Swedish translations
* Documentation
* [Doclets.io](https://doclets.io/fewieden/MMM-soccer/master) integration
* Contributing guidelines
* Issue template
* Pull request template
* Editor config

### Changed

* Switched from Api v1 to v2.
* Updated league ids.
* Switched rendering from js to nunjuck template.
* Updated travis-ci config.
* Disabled markdown lint rules `MD024` and `MD026`

## [1.0.0]

Initial version
