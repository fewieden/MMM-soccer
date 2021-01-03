# MMM-soccer [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/fewieden/MMM-soccer/master/LICENSE) ![Build status](https://github.com/fewieden/MMM-soccer/workflows/build/badge.svg) [![Code Climate](https://codeclimate.com/github/fewieden/MMM-soccer/badges/gpa.svg?style=flat)](https://codeclimate.com/github/fewieden/MMM-soccer) [![Known Vulnerabilities](https://snyk.io/test/github/fewieden/mmm-soccer/badge.svg)](https://snyk.io/test/github/fewieden/mmm-soccer) [![codecov](https://codecov.io/gh/fewieden/MMM-soccer/branch/master/graph/badge.svg?token=vB22qyfCXz)](https://codecov.io/gh/fewieden/MMM-soccer)

European Soccer Standings Module for MagicMirror²

## Example

![](.github/regular.png) ![](.github/modal.png)

## Dependencies

* An installation of [MagicMirror²](https://github.com/MichMich/MagicMirror)
* OPTIONAL: [Voice Control](https://github.com/fewieden/MMM-voice) and [MMM-Modal](https://github.com/fewieden/MMM-Modal)
* npm
* [request](https://www.npmjs.com/package/request)

## Installation

* Clone this repo into `~/MagicMirror/modules` directory.
* Configure your `~/MagicMirror/config/config.js`:

```js
{
    module: 'MMM-soccer',
    position: 'bottom_right',
    config: {
        // add your config options here
    }
}
```

* Run command `npm i --production` in `~/MagicMirror/modules/MMM-soccer` directory.
* Optional: Get a free api key [here](http://api.football-data.org/register)

## Config Options

| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `api_key` | false | Either false (limited to 50 requests a day) or an API Key obtained from <http://api.football-data.org/register> (limited to 50 requests a minute) . |
| `colored` | false | Boolean to show club logos in color or not. |
| `show` | 'GERMANY' | Which league should be displayed  'GERMANY', 'FRANCE', 'ENGLAND', 'SPAIN' or 'ITALY' |
| `focus_on` | false | Which team should the standings focus on per league e.g. {"GERMANY": "FC Bayern München", "FRANCE": "Olympique Lyonnais"}. Omit this option or set to false to show the full league table. |
| `max_teams` | false | How many teams should be displayed. Omit this option or set to false to show the full league table. |
| `leagues` | `{"GERMANY": "BL1", "FRANCE": "FL1", "ENGLAND": "PL", "SPAIN": "PD", "ITALY": "SA"}` | A collection of leagues obtained from <http://api.football-data.org/v2/competitions> |
| `logos` | `false` | Boolean to show club logos or not. |

## OPTIONAL: Voice Control and Modal

This module supports voice control by [MMM-voice](https://github.com/fewieden/MMM-voice) and [MMM-Modal](https://github.com/fewieden/MMM-Modal).
In order to use this feature, it's required to install the voice and modal modules. There are no extra config options for voice control and modals needed.

### Mode

The voice control mode for this module is `SOCCER`

### List of all Voice Commands

* OPEN HELP -> Shows the information from the readme here with mode and all commands.
* CLOSE HELP -> Hides the help information.
* SHOW STANDINGS OF COUNTRY NAME -> Switch standings to specific league.
  Valid country names are (Default: GERMANY, FRANCE, ENGLAND, SPAIN or ITALY)
  set in config. (Effect stays until your mirror restarts, for permanent change
  you have to edit the config)
* EXPAND VIEW -> Expands the standings table and shows all teams.
* COLLAPSE VIEW -> Collapse the expanded view.

## Developer

* `npm run lint` - Lints JS and CSS files.
* `npm run docs` - Generates documentation.
