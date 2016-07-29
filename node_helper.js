const request = require('request');
const NodeHelper = require("node_helper");
module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting module: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_DATA") {
            var options = {
                url: "http://api.football-data.org/v1/competitions/" + payload.league + "/leagueTable"
            };
            if(payload.api_key){
                options['headers'] = {'X-Auth-Token': payload.api_key};
            }
            this.getData(options);
        }
    },

    getData: function(options) {
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                this.sendSocketNotification("DATA", JSON.parse(body));
            } else {
                console.log("Error "+response.statusCode)
            }
        });
    }
});