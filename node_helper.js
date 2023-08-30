/**
 * @file node_helper.js
 *
 * @author lavolp3 / fewieden (original module)
 * @license MIT
 *
 * @see  https://github.com/lavolp3/MMM-soccer
 */

/* jshint esversion: 6 */

const axios = require('axios');
const NodeHelper = require('node_helper');
const moment = require('moment');

module.exports = NodeHelper.create({

    matches: {},
    tables: {},
    teams: {},
    teamList: {},
    liveMatches: [],
    liveLeagues: [],
    isRunning: false,

    start: function() {
        console.log(`Starting module: ${this.name}`);
    },


    socketNotificationReceived: function(notification, payload) {
        if (notification === 'GET_SOCCER_DATA') {
            this.log("Socket notification received: " + notification + " Payload: " + JSON.stringify(payload));
            this.config = payload;
            this.leagues = this.config.show;
            this.headers = payload.api_key ? { 'X-Auth-Token': payload.api_key } : {};
            this.getTables(this.leagues);
            this.getMatches(this.leagues);
            if (!this.isRunning) {
                this.log("Starting API call cycle");
                this.liveMode = false;
                this.isRunning = true;
                this.scheduleAPICalls(false);
            }
        }
    },

    scheduleAPICalls: function(live) {
        var self = this;
        //var updateInterval = (this.liveLeagues.length > 0) ? (60/(Math.floor(5/this.liveLeagues.length))) * 1000 : this.config.apiCallInterval * 1000;
        var updateInterval = (this.liveLeagues.length > 0) ? 60 * 1000 : this.config.apiCallInterval * 1000;
        this.callInterval = setInterval(() => {
            self.getTables(self.leagues);
            self.getMatches(self.leagues);
            //self.getMatchDetails(self.liveMatches);
        }, updateInterval);
    },

    getTables: function(leagues) {
        var self = this;
        this.log("Collecting league tables for leagues: "+leagues);
        var urlArray = leagues.map(league => { return `http://api.football-data.org/v4/competitions/${league}/standings`; });
        Promise.all(urlArray.map(url => {
            return axios.get(url, { headers: self.headers })
            .then(function (response) {
                self.log("Requests available: " + response.headers["x-requests-available-minute"]);
                var tableData = response.data;
                var tables = {
                    competition: tableData.competition,
                    season: tableData.season,
                    standings: tableData.standings,
                };
                self.log(tables);
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
            self.log("Collected Teams: " + JSON.stringify(self.teams));
            self.sendSocketNotification("TABLES", self.tables);
            self.sendSocketNotification("TEAMS", self.teams);
        })
        /*.catch(function(error) {
            console.error("[MMM-soccer] ERROR occured while fetching tables: " + error);
        });*/
    },

    getMatches:function(leagues) {
        var now = moment().subtract(60*13, "minutes");	//subtract minutes or hours to test live mode
        this.log("Collecting matches for leagues: " + leagues);
        var urlArray = leagues.map(league => { return `http://api.football-data.org/v4/competitions/${league}/matches`; });
        this.liveLeagues = [];
        var self = this;
        Promise.all(urlArray.map(url => {
            return axios.get(url, { headers: self.headers })
            .then(function (response) {
                //self.log("Requests available: " + response.headers["x-requests-available-minute"]);
                var matchesData = response.data;
                var currentLeague = matchesData.competition.code;
                matchesData.matches.forEach(match => {
                    delete match.referees;

                    //check for live matches
                    if (match.status == "IN_PLAY" || Math.abs(moment(match.utcDate).diff(now, 'seconds')) < self.config.apiCallInterval * 2) {
                        if (self.liveMatches.indexOf(match.id) === -1) {
                            self.log(`Live match detected starting at ${moment(match.utcDate).format("HH:mm")}, Home Team: ${match.homeTeam.name}`);
                            self.log(`Live match ${match.id} added at ${moment().format("HH:mm")}`);
                            self.liveMatches.push(match.id);
                        }
                        if (self.liveLeagues.indexOf(currentLeague) === -1) {
                            self.log(`Live league ${currentLeague} added at ${moment().format("HH:mm")}`);
                            self.liveLeagues.push(currentLeague);
                        }
                    } else {
                        if (self.liveMatches.indexOf(match.id)!= -1) {
                            self.log("Live match finished!");
                            self.liveMatches.splice(self.liveMatches.indexOf(match.id), 1);
                        }
                    }
                });
                return(matchesData);
                self.log(matchesData);
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
            //self.log(self.matches);
            self.log("Live matches: "+JSON.stringify(self.liveMatches));
            self.log("Live leagues: "+JSON.stringify(self.liveLeagues));
            self.sendSocketNotification("MATCHES", self.matches);
            self.toggleLiveMode(self.liveMatches.length > 0);
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
                self.log("Requests available: " + response.headers["x-requests-available-minute"]);
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
        console.log("An error occured while requesting the API for Data: "+error);
        console.log("URL: "+url);
        if (error.response && error.response.status === 429) {
            console.log(error.response.status + ": API Request Quota of 10 calls per minute exceeded. Try selecting less leagues.");
        } else if (error.request) {
            //console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error: ', error.message);
        }
    },

    toggleLiveMode: function (isLive) {
        if (isLive != this.liveMode) {
            clearInterval(this.callInterval);
            if (isLive) {
                this.log("Live Mode activated!");
                //this.leagues = this.liveLeagues;
                this.sendSocketNotification("LIVE", { live: true, matches: this.liveMatches, leagues: this.liveLeagues });
                this.scheduleAPICalls(true);
            } else {
                this.log("Usual mode active!");
                //this.leagues = this.config.show;
                this.sendSocketNotification("LIVE", { live: false, matches: this.liveMatches, leagues: this.liveLeagues });
                this.scheduleAPICalls(false);
            }
            this.liveMode = isLive;
        }
    },

    log: function (msg) {
        if (this.config && this.config.debug) {
            console.log(this.name + ":", JSON.stringify(msg));
        }
    },
});
