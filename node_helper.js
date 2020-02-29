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

const axios = require('axios');
const NodeHelper = require('node_helper');
const moment = require('moment');

/**
 * @module node_helper
 * @description Backend for the module to query data from the API provider.
 *
 * @requires external:request
 * @requires external:node_helper
 */
module.exports = NodeHelper.create({

    matches: {},
    tables: {},
    teams: {},
    teamList: {},
    liveMatches: [],
    liveLeagues: [],

    start: function() {
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
    socketNotificationReceived: function(notification, payload) {
        this.log("Socket notification received: "+notification+" Payload: "+JSON.stringify(payload));
        this.headers = payload.api_key ? { 'X-Auth-Token': payload.api_key } : {};
        this.config = payload;
        if (notification === 'GET_SOCCER_DATA') {
            this.config = payload;
            this.scheduleAPICalls(false);
        }
    },

    /**
     * @function scheduleAPICalls
     * @description Sends request to the node_helper to fetch data for the current selected leagues.
     */
    scheduleAPICalls: function(live) {
        this.getTables(this.config.show);
        this.getMatches(this.config.show);
        var self = this;
        if (live === false) {
            this.mainInterval = setInterval(() => {
                if (self.liveMatches.length > 0) {
                    self.toggleLiveMode(true);
                } else {
                    self.getTables(self.config.show);
                    //self.getMatches(self.config.show);
                }
            }, this.config.apiCallInterval * 1000);
        } else {
            var liveUpdateInterval = Math.max(Math.floor(10/(this.liveLeagues.length * 2)), 1) * 1000;
            console.log("Live update interval: "+liveUpdateInterval);
            this.liveInterval = setInterval(() => {
                if (self.liveMatches.length == 0) {
                    self.toggleLiveMode(false);
                } else {
                    //self.getTables(self.config.show);
                    //self.getMatches(self.config.show);
                    //self.getMatchDetails(self.liveMatches);
                }
            }, liveUpdateInterval);
        }
    },

    /**
     * @function getTables
     * @description Request data from the supplied URL and broadcast it to the MagicMirror module if it's received.
     *
     * @param {Object} options - request optionsthe notification.
     */
    getTables: function(leagues) {
        var self = this;
        this.log("Collecting league tables for leagues: "+leagues);
        var urlArray = leagues.map(league => { return `http://api.football-data.org/v2/competitions/${league}/standings`; });
        //this.log(urlArray);
        Promise.all(urlArray.map(url => {
            return axios.get(url, { headers: self.headers })
            .then(function (response) {
                var tableData = response.data;
                var tables = {
                    competition: tableData.competition,
                    season: tableData.season,
                    standings: tableData.standings,
                };
                //self.log(tables);
                return(tables);
            })
            .catch(function (error) {
                self.handleErrors(error, url);
                return {};
            });
        }))
        .then(function(tableArray) {
            tableArray.forEach(tables => {
                if (tables.hasOwnProperty('standings')) {
                    tables.standings.forEach(standing => {
                        standing.table.forEach(team => {
                            self.teams[team.team.id] = team.team;
                            self.teamList[team.team.name] = team.team.name;
                        });
                    });
                    self.tables[tables.competition.code] = tables;
                 }
            });
            //self.log("Collected Tables: " + self.tables);
            //self.log("Collected Teams: " + JSON.stringify(self.teams));
            //self.log("TableArray: " + tableArray);
            self.sendSocketNotification("TABLES", self.tables);
            self.sendSocketNotification("TEAMS", self.teams);
        })
        .catch(function(error) {
            console.error("[MMM-soccer] ERROR occured while fetching tables: " + error);
        });
    },

    getMatches: function(leagues) {
        var self = this;
        this.log("Collecting matches for leagues: "+leagues);
        var urlArray = leagues.map(league => { return `http://api.football-data.org/v2/competitions/${league}/matches`; });
        Promise.all(urlArray.map(url => {
            return axios.get(url, { headers: self.headers })
            .then(function (response) {
                var matchesData = response.data;
                var league = matchesData.competition.code;
                matchesData.matches.forEach(match => {
                    delete match.referees;
                    //check for live matches
                    if (moment(match.utcDate).add(90, 'minutes').diff(moment()) > 0 && moment(match.utcDate).diff(moment(), 'seconds') < self.config.apiCallInterval) {
                        if (self.liveMatches.indexOf(match.id) === -1) {
                            console.log(`Live match detected starting at ${moment(match.utcDate).format("HH:mm")}, Home Team: ${match.homeTeam.name}`);
                            self.liveMatches.push(match.id);
                        }
                        if (self.liveLeagues.indexOf(league) === -1) {
                            self.log(`Live league ${league} added at ${moment().format("HH:mm")}`);
                            self.liveLeagues.push(league);
                        }
                    }
                });
                return(matchesData);
            })
            .catch(function (error) {
                self.handleErrors(error, url);
                return {};
            });
        }))
        .then(function (matchesArray) {
            matchesArray.forEach(comp => {
                if (comp.hasOwnProperty('competition')) {
                    self.matches[comp.competition.code] = comp;
                }
            });
            //self.log("Collected Matches: "+self.matches);
            self.log("Live matches: "+JSON.stringify(self.liveMatches));
            self.sendSocketNotification("MATCHES", self.matches);
        })
        .catch(function(error) {
            console.error("[MMM-soccer] ERROR occured while fetching matches: " + error);
        });
    },


    getMatchDetails: function (matches) {
        var self = this;
        this.log("Getting match details for matches: " + matches);
        var urlArray = matches.map(match => { return `http://api.football-data.org/v2/matches/${match}`; });
        Promise.all(urlArray.map(url => {
            return axios.get(url, { headers: self.headers })
            .then(function (response) {
                var matchData = response.data;
                self.log(matchData);
                if (matchData.match.status != "IN_PLAY" && self.liveMatches.indexOf(matchData.match.id)!= -1) {
                    self.log("Live match finished");
                    self.liveMatches.splice(self.liveMatches.indexOf(comp.matches[m].id), 1);
                    self.log("Live matches: "+self.liveMatches);
                }
                return(matchData);
            })
            .catch(function (error) {
                self.handleErrors(error, url);
                return {};
            });
        }))
        .then(function (liveMatchesArray) {
            /*LiveMatchesArray.forEach(match => {
                liveMatches[match.match.competition.id] = match;
            });*/
            self.sendSocketNotification("LIVE_MATCHES", liveMatchesArray);
        });
    },

    handleErrors: function(error, url) {
        console.log("An error occured while requesting the API for Data:");
        console.log("URL: "+url);
        if (error.response.status === 429) {
            console.log(error.response.status + ": API Request Quota of 10 calls per minute exceeded. Try selecting less leagues.");
        } else if (error.request) {
            console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error ', error.message);
        }
    },

    toggleLiveMode: function (isLive) {
        if (isLive) {
            clearInterval(this.mainInterval);
            this.log("Live Mode activated, main interval stopped.");
            this.sendSocketNotification("LIVE", { matches: this.liveMatches, leagues: this.liveLeagues });
            this.scheduleAPICalls(true);
        } else {
            clearInterval(this.liveInterval);
            this.log("Live Mode deactivated, back to main interval.");
            this.sendSocketNotification("LIVE", { matches: this.liveMatches, leagues: this.liveLeagues });
            this.scheduleAPICalls(false);
        }
    },

    log: function (msg) {
        if (this.config && this.config.debug) {
            console.log(this.name + ":", JSON.stringify(msg));
        }
    },
});
