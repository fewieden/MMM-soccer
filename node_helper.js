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
 * @external node-fetch
 * @see https://www.npmjs.com/package/node-fetch
 */
const fetch = require('node-fetch');

/**
 * @external node_helper
 * @see https://github.com/MichMich/MagicMirror/blob/master/modules/node_modules/node_helper/index.js
 */
const NodeHelper = require('node_helper');

/**
 * @module node_helper
 * @description Backend for the module to query data from the API provider.
 *
 * @requires external:node-fetch
 * @requires external:node_helper
 */
module.exports = NodeHelper.create({
    /**
     * @function socketNotificationReceived
     * @description Receives socket notifications from the module.
     * @override
     *
     * @param {string} notification - Notification name
     * @param {*} payload - Detailed payload of the notification.
     *
     * @returns {void}
     */
    socketNotificationReceived(notification, payload) {
        if (notification === 'GET_DATA') {
            const url = `http://api.football-data.org/v2/competitions/${payload.league}/standings`;
            const options = {};

            if (payload.api_key) {
                options.headers = { 'X-Auth-Token': payload.api_key };
            }

            this.getData(url, options);
        }
    },

    /**
     * @function getData
     * @description Request data from the supplied URL and broadcast it to the MagicMirror module if it's received.
     * @async
     *
     * @param {string} url - URL to fetch data from.
     * @param {Object} options - Request options containing the api key if provided as header.
     *
     * @returns {void}
     */
    async getData(url, options) {
        const response = await fetch(url, options);

        if (!response.ok) {
            console.error(`Getting league table: ${response.status} ${response.statusText}`);

            return;
        }

        const parsedResponse = await response.json();

        this.sendSocketNotification('DATA', parsedResponse);
    }
});
