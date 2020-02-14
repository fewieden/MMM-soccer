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
        console.log("Socket notification received: "+notification+" Payload: "+JSON.stringify(payload));
		this.headers = payload.api_key ? { 'X-Auth-Token': payload.api_key } : {}
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
			this.getTables(payload.leagues);
		} else if (notification === 'GET_MATCHES') {
			this.getMatches(payload.leagues);
        } /*else if (notification === 'GET_TODAYS_MATCHES') {
            this.getMatches(this.options.currentMatches, payload.leagues);
        }*/
    },

    /**
     * @function getTable
     * @description Request data from the supplied URL and broadcast it to the MagicMirror module if it's received.
     *
     * @param {Object} options - request optionsthe notification.
     */
    getTables(leagues) {
		self = this;
		console.log("Collecting league tables for leagues: "+leagues);
		var urlArray = leagues.map(league => { return `http://api.football-data.org/v2/competitions/${league}/standings`; })
		console.log(urlArray);
		Promise.all(urlArray.map(url => {
        	return axios.get(url, { headers: self.headers })
				.then(function (response) {
					var tableData = response.data;
					var table = {
						competition: tableData.competition,
						season: tableData.season,
						standings: tableData.standings.filter(table => {return table.type === "TOTAL"})
					};
					//console.log(table);
					return(table);
				})
				.catch(function (err) {
					console.log(`Error fetching league table for url ${url}: ${err}`);
					return "";
				});
		}))
		.then(function (tableArray) {
			//console.log("TableArray: "+JSON.stringify(tableArray));
			self.sendSocketNotification("TABLES", tableArray);
		});
	},

    getMatches(leagues) {
	self = this;
	console.log("Collecting matches for leagues: "+leagues);
	var urlArray = leagues.map(league => { return `http://api.football-data.org/v2/competitions/${league}/matches`; })
        Promise.all(urlArray.map(url => {
        	return axios.get(url, { headers: self.headers })
			.then(function (response) {
				var matchesData = response.data;
               			matchesData.matches.forEach(element => delete element.referees);
				console.log(JSON.stringify(matchesData));
				return(matchesData);
			})
			.catch(function (err) {
				console.log(`Error fetching matches with url ${url}: ${err}`);
				return "";
			});
	}))
	.then(function (matchesArray) {
		//console.log("MatchesArray: "+JSON.stringify(matchesArray));
		self.sendSocketNotification("MATCHES", matchesArray);
	});
    },

});
