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

const _ = require('lodash');

/**
 * @external node_helper
 * @see https://github.com/MichMich/MagicMirror/blob/master/modules/node_modules/node_helper/index.js
 */
const NodeHelper = require('node_helper');

const {handleError, initProvider, getProvider} = require('./provider');

const MINUTE_IN_MILLISECONDS = 60 * 1000;
const DATA_TYPES = ['standings', 'scorers'];

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

            this.scheduleRequests(payload);
        }
    },

    transformCompetitions(config) {
        const grouped = _.transform(config.competitions, (competitions, competition) => {
            _.set(competitions, [competition.code, 'code'], competition.code);

            for (const type of DATA_TYPES) {
                _.set(competitions, [competition.code, type], _.get(competition, [type, 'provider']));
            }

            return competitions;
        }, {});

        return _.values(grouped);
    },

    scheduleRequests(config) {
        const compactCompetitions = this.transformCompetitions(config);

        for (const [index, type] of DATA_TYPES.entries()) {
            setTimeout(() => {
                setInterval(() => this.makeRequests(compactCompetitions, type), (10 + DATA_TYPES.length) * MINUTE_IN_MILLISECONDS);
                this.makeRequests(compactCompetitions, type);
            }, index * MINUTE_IN_MILLISECONDS);
        }
    },

    async createSingleRequest(competition, type) {
        const provider = _.get(competition, type);

        if (!provider) {
            return;
        }

        const method = `fetch${_.upperFirst(type)}`;

        try {
            const response = await getProvider(provider)[method](competition.code);

            return response;
        } catch (error) {
            handleError(error);
        }
    },

    async makeRequests(competitions, type) {
        const requests = _.map(competitions, competition => this.createSingleRequest(competition, type));

        const responses = await Promise.all(requests);

        const indexedCompetitions = _.transform(responses, (indexed, response) => {
            if (_.isArray(_.get(response, type))) {
                indexed[response.code] = response[type];
            }
        }, {});

        this.sendSocketNotification(type, indexedCompetitions);
    }
});
