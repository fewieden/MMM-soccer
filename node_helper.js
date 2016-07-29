const request = require('request');
const NodeHelper = require("node_helper");
module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting module: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_DATA") {
            var options = {};
            if(payload.api_key){
                options = {
                    url: "http://api.football-data.org/v1/soccerseasons/" + payload.league + "/leagueTable",
                    headers: {
                        'X-Auth-Token': payload.api_key
                    }
                };
            } else {
                options = {
                    url: "http://api.football-data.org/v1/soccerseasons/" + payload.league + "/leagueTable"
                };
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