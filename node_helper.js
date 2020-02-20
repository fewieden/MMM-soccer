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
        this.log("Socket notification received: "+notification+" Payload: "+JSON.stringify(payload));
        this.headers = payload.api_key ? { 'X-Auth-Token': payload.api_key } : {};
        this.config = payload;
        self = this;
        /*this.options = {
            standings: {
                url: `http://api.football-data.org/v2/competitions/${payload.league}/standings`,
                headers: payload.api_key ? { 'X-Auth-Token': payload.api_key } : {}
            },
            compMatches: {
                url: `http://api.football-data.org/v2/competitions/${payload.league}/matches`,
                headers: payload.api_key ? { 'X-Auth-Token': payload.api_key } : {}
            },
            matches: {
                url: `http://api.football-data.org/v2/matches/`,
                headers: payload.api_key ? { 'X-Auth-Token': payload.api_key } : {}
            },

        };*/

        if (notification === 'GET_TABLES') {
            this.getTables(payload.show);
        } else if (notification === 'GET_MATCHES') {
            this.getMatches(payload.show);
        } /*else if (notification === 'GET_TODAYS_MATCHES') {
            this.getMatches(this.options.currentMatches, payload.show);
        }*/
    },

    /**
     * @function getTables
     * @description Request data from the supplied URL and broadcast it to the MagicMirror module if it's received.
     *
     * @param {Object} options - request optionsthe notification.
     */
    getTables(leagues) {
        self = this;
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
                    //this.log(tables);
                    return(tables);
        		})
    	      .catch(function (err) {
      	        console.log(`Error fetching league table for url ${url}: ${err}`);
          	    return "";
  	    		});
  		  }))
        .then(function(tableArray) {
            tableArray.forEach(tables => {
                tables.standings.forEach(standing => {
                    standing.table.forEach(team => {
                        self.teams[team.team.id] = team.team;
                    });
                });
                self.tables[tables.competition.code] = tables;
            });
            //this.log("Collected tables: "+self.tables);
            this.log("Collected Teams: "+self.teams);
            //this.log("TableArray: "tableArray);
            self.sendSocketNotification("TABLES", self.tables);
            self.sendSocketNotification("TEAMS", self.teams);
        });
    },

    getMatches(leagues) {
        self = this;
        console.log("Collecting matches for leagues: "+leagues);
        var urlArray = leagues.map(league => { return `http://api.football-data.org/v2/competitions/${league}/matches`; });
        Promise.all(urlArray.map(url => {
        	  return axios.get(url, { headers: self.headers })
            .then(function (response) {
                var matchesData = response.data;
                var league = matchesData.competition.code;
                matchesData.matches.forEach(match => {
                    delete match.referees;
                    //match.focused = (match.homeTeam.name === self.config.focus_on[league]) ? true : (match.awayTeam.name === self.config.focus_on[league]) ? true : false;
                });
                //this.log(matchesData);
                return(matchesData);
            })
            .catch(function (err) {
                console.log(`Error fetching matches with url ${url}: ${err}`);
                return "";
            });
        }))
        .then(function (matchesArray) {
            matchesArray.forEach(comp => {
                self.matches[comp.competition.code] = comp;
            });
            //this.log("Collected Matches: "+self.matches);
            self.sendSocketNotification("MATCHES", self.matches);
        });
    },
	
	log: function (msg) {
        if (this.config && this.config.debug) {
            console.log(this.name + ":", JSON.stringify(msg));
        }
    },
});
