/* MMM-soccer
 * Node Helper
 *
 * By fewieden https://github.com/fewieden/MMM-soccer
 *
 * MIT Licensed.
 */

const request = require('request');

module.exports = NodeHelper.create({

	// Subclass start method.
    start: function() {
        console.log("Starting module: " + this.name);
    },

	// Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_DATA") {
            var options = {
                url: "http://api.football-data.org/v1/competitions/" + payload.league + "/leagueTable"
            };
            if(payload.api_key){
                options.headers = {'X-Auth-Token': payload.api_key};
            }
            this.getData(options);
        }
    },

	/**
	 * getData
	 * Request data from the supplied URL and broadcast it to the MagicMirror module if it's received.
	 */
    getData: function(options) {
		console.log("Get league table for url " + options.url);
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                this.sendSocketNotification("DATA", JSON.parse(body));
            } else {
				this.sendSocketNotification("DATA"); 
                console.log("Error getting league table " + response.statusCode);
            }
        });
    }
});