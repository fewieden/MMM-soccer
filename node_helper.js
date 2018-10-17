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

/**
 * @external request
 * @see https://www.npmjs.com/package/request
 */
const request = require('request');

/**
 * @external node_helper
 * @see https://github.com/MichMich/MagicMirror/blob/master/modules/node_modules/node_helper/index.js
 */
const NodeHelper = require('node_helper');

/**
 * @module node_helper
 * @description Backend for the module to query data from the API provider.
 *
 * @requires external:request
 * @requires external:node_helper
 */
module.exports = NodeHelper.create({

    /**
     * @function start
     * @description Logs a start message to the console.
     * @override
     */
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
            const options = {
                url: `http://api.football-data.org/v2/competitions/${payload.league}/standings`
            };
            if (payload.api_key) {
                options.headers = { 'X-Auth-Token': payload.api_key };
            }
            this.getData(options);
        }
    },

    /**
     * @function getData
     * @description Request data from the supplied URL and broadcast it to the MagicMirror module if it's received.
     *
     * @param {Object} options - request optionsthe notification.
     */
    getData(options) {
        console.log(`Get league table for url ${options.url}`);
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                this.sendSocketNotification('DATA', JSON.parse(body));
            } else {
                this.sendSocketNotification('DATA');
                console.log(`Error getting league table ${response.statusCode}`);
            }
        });
    }
});
