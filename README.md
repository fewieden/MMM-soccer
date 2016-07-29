# MMM-soccer
European Soccer Standings Module for MagicMirror<sup>2</sup>

## Dependencies
  * An installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)
  * npm
  * [request](https://www.npmjs.com/package/request)

## Installation
 1. Clone this repo into `~/MagicMirror/modules` directory.
 2. Configure your `~/MagicMirror/config/config.js`:

    ```
    {
        module: 'MMM-soccer',
        position: 'bottom_right',
        config: {
            ...
        }
    }
    ```
 3. Run command `npm install` in `~/MagicMirror/modules/MMM-soccer` directory.
 4. Optional: Get a free api key (here)[http://api.football-data.org/register]

## Config Options
| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `api_key` | false | Ability to request data more than 50 times a day. Get a free api key (here)[http://api.football-data.org/register] |
| `show` | 'GERMANY' | Which league should be displayed  'GERMANY', 'FRANCE', 'ENGLAND', 'SPAIN' or 'ITALY' |