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
```
git clone https://github.com/lavolp3/MMM-soccer
```
2. Run command `npm install` in `~/MagicMirror/modules/MMM-soccer` directory.
3. Add the module to your `~/MagicMirror/config/config.js`:

    ```
    {
        module: 'MMM-soccer',
        position: 'top_left',
        config: {
            api_key: '',
            show: ['CL', 'BL1', 'PL'],
            colored: true,
            updateInterval: 60,
            focus_on: {
                null
            },
            max_teams: 5,
            matchType: 'league'
        }
    },
    ```


4. Optional: Get a free api key [here](http://api.football-data.org/register) (highly recommended)


## Config Options

| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `width` | `400` | Width of match and standings table. The module has a flexible design aligning matches and table vertically or horizontically as space allows. |
| `api_key` | false | Either false (limited to 50 requests a day) or an API Key obtained from <http://api.football-data.org/register> (limited to 10 requests a minute) . |
| `colored` | true | Boolean to show club logos in color or not. |
| `show` | ['BL1', 'PL', 'CL'] | An array of league codes to be displayed. In normal mode, the leagues revolve using below update cycle. With activated touch mode (see below), you can choose one of the leagues via a button (planned) |
| `updateInterval` | 60 | The time frame for each league to be shown in seconds. |
| `apiCallInterval` | 10 | The time frame for API calls (in minutes) in normal mode. |
| `showMatches` | true | Show matches of current league |
| `showTables` | true | Show table of current league. **Note:** For cups like Champions League, this will be set to false in knockout rounds. |
| `focus_on` | null | Which team to focus on per league. This needs to be an object, e.g. {'BL1': 'FC Bayern München', 'CL': 'Liverpool FC'}. **See description below.** |
| `fadeFocus` | true | Includes fading the teams out if one is focused. |
| `max_teams` | false | How many teams should be displayed when focus is activated. Omit this option or set to false to show the full league table. |
| `replace` | 'default' | Choose between 'default' for a default replacement of original club names or 'short' for a 3-Letter-Code of the teams. Choose anything else (like '') for original team names from the API. **See below** for further information |
| `logos` | true | Boolean to show club logos. |
| `liveMode` | true | Activates live mode when games are in play. (see below) |
| `matchType` | 'league' | Choose between the following: `'league'` for showing the current matchday of selected leagues (in `show`), `'next'` for showing the next matches of all your focused clubs (in `focus_on`), `'daily'` for showing all of todays matches for selected leagues. |
| `numberOfNextMatches` | 8 | Defines number of next matches of all focused clubs for matchType `'next'` |
| `touchMode` | false | Activates touch mode with touch options (see below, not active yet) |
| `debug` | false | Debug mode: additional output on server side (console) and client side (browser) |


## Focus

You can focus on one time per league/cup using the focus_on method. This variable needs to be an object.
An example is below:
```
focus_on: {
    'BL1': 'FC Bayern München',
    'CL': 'Liverpool FC'
},
```
Please take care to include all quotation marks, separate with commata, and use the same league codes (find below) you have included in the 'show' array.
The team name needs to correspond to the original name of the team as provided by the API.
Have a look into the `replace` object in the config to see if the team name is replaced with a shorter one on the mirror. If that is the case, take the original one (the one on the left for each replace property).

Omitting a league code from `'show'` in this array will show the full league table and not include any focus.
Any league included here need to be included in `'show'` as well to show the league on your mirror.

## Replacements
There is a `replacements.json` file in the directory including all teams of the free plan. By default, the default replacement for the original team name will be used in the module. You can choose between 'default' mode or 'short' mode showing the 3-letter ID code for the team for a super slim module.

## Live Mode

The module calls all requested matches every X minutes (see config option `apiCallInterval`). Whenever one or more matches are scheduled in less than this interval, a Live Mode will activate.
All matches currently played will be included in an array and requested once every minute.
~Additional informations like game minute and scorers will be provided for these games.~ (another API is needed for this)
Also, only the leagues with current matches will be shown.
When no game is live, the module will return back to normal mode.

Can be switched off in config.


## Touch mode (planned)

Touch mode will create buttons to choose between leagues.
It is also planned to include more detailed information like scorers per league and scorers per game.

Can be switched off in config.


## OPTIONAL: Voice Control (may be bugged!)

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


## List of available leagues (for the free API):

As per the [Football-data API Docs](https://www.football-data.org/documentation/api#league-codes):


| **League** | **Code** |
| --- | --- |
| (Europe) Champions League | 'CL' |
| (Europe) European Championship 2020 | 'EC' |
| (English) Premier League | 'PL' |
| (English) Championship | 'ELC' |
| (German) Bundesliga | 'BL1' |
| (Italian) Serie A | 'SA' |
| (French) Ligue 1 | 'FL1' |
| (Spain) La Liga | 'PD' |
| (Portugal) Primiera Liga | 'PPL' |
| (Netherlands) Eredivisie | 'DED' |
| (Brazil) Serie A | '' |


### TODOs

- [ ] Current top scorer list per league
- [ ] Touch mode
- [ ] Tap additional API (presumably API-football) for further competitions (e.g. DFB cup)
- [ ] Option to show fixed table head with focus on.
- [x] Highlight currently playing teams in table.


Add team specific data, e.g.
- [ ] next matches
- [ ] ~current squad / line-up~ not available in free plan!
- [ ] ~Include option to show scorers for each match~ not available in free plan!
