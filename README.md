# MMM-soccer [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/fewieden/MMM-soccer/master/LICENSE)

A Soccer Standings Module for MagicMirror², based on @fewiedens [MMM-soccer](https://github.com/fewieden/MMM-soccer)

## Examples

![](.github/example1.JPG) ![](.github/example2.JPG)

## Dependencies

* An installation of [MagicMirror²](https://github.com/MichMich/MagicMirror)
* OPTIONAL: [Voice Control](https://github.com/fewieden/MMM-voice)
* npm
* [axios](https://www.npmjs.com/package/axios)

## Installation

1. Clone this repo into your `~/MagicMirror/modules` directory.
```git clone https://github.com/lavolp3/MMM-soccer```
2. Run command `npm install` in `~/MagicMirror/modules/MMM-soccer` directory.
3. Configure your `~/MagicMirror/config/config.js`:

    ```
    {
        module: 'MMM-soccer',
        position: 'bottom_left',
        config: {
            ...
        }
    }
    ```


4. Optional: Get a free api key [here](http://api.football-data.org/register) (highly recommended)


## Config Options

| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `width` | `400` | Width of match and standings table. The module has a flexible design aligning matches and table vertically or horizontically as space allows. |
| `api_key` | false | Either false (limited to 50 requests a day) or an API Key obtained from <http://api.football-data.org/register> (limited to 10 requests a minute) . |
| `colored` | true | Boolean to show club logos in color or not. |
| `show` | ['BL1', 'PL', 'CL'] | An array of league codes to be displayed. With activated touch mode (see below) |
| `showMatches` | true | Show matches of current league |
| `showTables` | true | Show table of current league. Remark: For cups like Champions league, this will be set to false in knockout mode. |
| `focus_on` | false | Which team should the standings focus on per league e.g. {'BL1': 'FC Bayern München', 'CL': 'Liverpool FC'. Leave out any league you do not want to have a focus for any team. Omit this option or set to false to show the full league tables. |
| `max_teams` | false | How many teams should be displayed when focus is activated. Omit this option or set to false to show the full league table. |
| `logos` | false | Boolean to show club logos or not. |
| `liveMode` | true | Activates live mode when games are in play. (see below, not active yet) |
| `touchMode` | false | Activates touch mode with touch options (see below, not active yet) |
| `debug` | false | Debug mode: additional output on server side (console) and client side (browser) |

## Live Mode (planned)

The modules calls all requested matches every 5 minutes. Whenever one or more matches are scheduled in less than 5 minutes, a Live Mode will activate.
All matches currently played will be included in an array and requested for updates as regularly as the free api (10 calls per minute) allows.
Additional informations like game minute and scorers will be provided for these games.
Also, only the leagues with current matches will be shown (does not count for touch mode)
When no game is active, the module will return back to normal mode. 

Can be switched off in config


## Touch mode (planned)

Touch mode will create buttons to choose between leagues.
It is also planned to include more detailed information like scorers per league and scorers per game.

Can be switched off in config

## OPTIONAL: Voice Control

This module supports voice control by @fewiedens [MMM-voice](https://github.com/fewieden/MMM-voice). In order to use this feature, it's required to install the voice module. There are no extra config options for voice control needed.


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

## List of available leagues (for the FREE API):

As per [Football-data API Docs](https://www.football-data.org/documentation/api#league-codes):

| **League** | **code** |
| (Europe) Champions League | 'CL1' |
| (Europe) European Championships 2020 | 'EC' |
| (English) Premier League | 'PL' |
| (English) Championship | 'ELC' |
| (German) Bundesliga | 'BL1' |
| (Italian) Serie A | 'PD' |
| (French) Ligue 1 | 'FL1' |
| (Spain) La Liga | 'PD' |
| (Portugal) Primiera Liga | 'PPL' |
| (Netherlands) Eredivisie | 'DED' |
| (Brazil) Serie A | --- |
