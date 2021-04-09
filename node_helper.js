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
 * @external node_helper
 * @see https://github.com/MichMich/MagicMirror/blob/master/modules/node_modules/node_helper/index.js
 */
const NodeHelper = require('node_helper');

const {handleError, initProvider, getProvider} = require('./provider');

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
    async socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG') {
            await initProvider(payload);
        } else if (notification === 'GET_DATA') {
            const {code, provider: {standings: provider} = {}} = payload.competition;

            if (!provider) {
                return;
            }

            try {
                const standings = await getProvider(provider).fetchStandings(code);

                this.sendSocketNotification('DATA', standings);
            } catch (error) {
                handleError(error);
            }
        }
    }
});
