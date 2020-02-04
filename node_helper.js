/**
 * @file node_helper.js
 *
 * @author fewieden
 * @license MIT
 *
 * @see  https://github.com/fewieden/MMM-soccer
 */

/* eslint-env node */
/* eslint-disable no-console */
/* jshint esversion: 6 */

const request = require('request');
const NodeHelper = require('node_helper');

/**
 * @module node_helper
 * @description Backend for the module to query data from the API provider.
 *
 * @requires external:request
 * @requires external:node_helper
 */
module.exports = NodeHelper.create({

    start() {
        console.log(`Starting module: ${this.name}`);
    },

    /**
     * @function socketNotificationReceived
     * @description Receives socket notifications from the module.
     * @override
     *
     * @param {string} notification - Notification name
     * @param {*} payload - Detailed payload of the notification.
     */
    socketNotificationReceived(notification, payload) {
        if (notification === 'GET_DATA') {
            this.options = {
                standings: {
                    url: `http://api.football-data.org/v2/competitions/${payload.league}/standings`,
                    headers: payload.api_key ? { 'X-Auth-Token': payload.api_key } : {}
                },
                matches: {
                    url: `http://api.football-data.org/v2/competitions/${payload.league}/matches`,
                    headers: payload.api_key ? { 'X-Auth-Token': payload.api_key } : {}
                },
                detailedMatches: {
                    url: `http://api.football-data.org/v2/competitions/${payload.league}/match/271584`,
                    headers: payload.api_key ? { 'X-Auth-Token': payload.api_key } : {}
                },
                scorers: {
                    url: `http://api.football-data.org/v2/competitions/${payload.league}/scorers`,
                    headers: payload.api_key ? { 'X-Auth-Token': payload.api_key } : {}
                }
            };
            this.getTable(this.options.standings);
        }
    },

    /**
     * @function getTable
     * @description Request data from the supplied URL and broadcast it to the MagicMirror module if it's received.
     *
     * @param {Object} options - request optionsthe notification.
     */
    getTable(options) {
        console.log(`Get league table for url ${options.url}`);
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                var tableData = JSON.parse(body);
                this.sendSocketNotification('DATA', tableData);
                console.log(tableData);
                var matchDay = tableData.season.currentMatchday;
                console.log(matchDay);

                this.getStandings(this.options.matches, matchDay);
                this.getMatches(this.options.detailedMatches, matchDay);
                this.getScorers(this.options.scorers);


            } else {
                this.sendSocketNotification('DATA');
                console.log(`Error getting league table ${response.statusCode}`);
            }
        });
    },

    getStandings(options, matchDay) {
        console.log(`Get league standings for url ${options.url}`);
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                var standingsData = JSON.parse(body);
                this.sendSocketNotification('STANDINGS', standingsData);
                matchDayStandings = standingsData.matches.filter(match => {
                    return (match.matchday === matchDay);
                });
                console.log(JSON.stringify(matchDayStandings));
            } else {
                this.sendSocketNotification('STANDINGS');
                console.log(`Error getting league match standings ${response.statusCode}`);
            }
        });
    },


    getMatches(options, matchDay) {
        console.log(`Get league matches for url ${options.url}`);
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                var matchData = JSON.parse(body);
                this.sendSocketNotification('MATCHES', matchData);
                /*matchDayStandings = standingsData.matches.filter(match => {
                    return (match.matchday === matchDay);
                });*/
                console.log(JSON.stringify(matchData));
            } else {
                console.log(`Error getting match details ${response.statusCode}`);
            }
        });
    },

    getScorers(options) {
        console.log(`Get scorers for url ${options.url}`);
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                var data = JSON.parse(body);
                this.sendSocketNotification('SCORERS', data);
                console.log(JSON.stringify(data));
            } else {
                console.log(`Error getting scorers  ${response.statusCode}`);
            }
        });
    }

});
