/**
 * @file MMM-soccer.js
 *
 * @author fewieden
 * @license MIT
 *
 * @see  https://github.com/fewieden/MMM-soccer
 */

/**
 * @external Module
 * @see https://github.com/MichMich/MagicMirror/blob/master/js/module.js
 */

/**
 * @external Log
 * @see https://github.com/MichMich/MagicMirror/blob/master/js/logger.js
 */

/**
 * @module MMM-soccer
 * @description Frontend of the MagicMirror² module.
 *
 * @requires external:Module
 * @requires external:Log
 */
Module.register('MMM-soccer', {
    /**
     * @member {string} requiresVersion - Defines the required minimum version of the MagicMirror framework in order to
     * run this version of the module.
     */
    requiresVersion: '2.14.0',

    /**
     * @member {Object} defaults - Defines the default config values.
     * @property {boolean|string} api_key - API acces key for football-data.org.
     * @property {boolean} colored - Flag to show logos in color or black/white.
     * @property {string} show - Country name (uppercase) to be shown in module.
     * @property {boolean|Object} focus_on - Hash of country name -> club name to determine highlighted team per league.
     * @property {boolean|int} max_teams - Maximium amount of teams to be displayed.
     * @property {boolean} logos - Flag to show club logos.
     * @property {Object} leagues - Hash of country name -> league id.
     */
    defaults: {
        colored: false,
        logos: false,
        rotationInterval: 15 * 1000,
        provider: {},
        competitions: []
    },

    standings: {},
    scorers: {},
    schedules: {},

    types: ['standings', 'schedules', 'scorers'],

    competitionIndex: 0,
    typeIndex: 0,

    /**
     * @function start
     * @description Adds nunjuck filters and requests for league data.
     * @override
     *
     * @returns {void}
     */
    start() {
        Log.info(`Starting module: ${this.name}`);
        this.addFilters();
        this.typeIndex = this.getNextTypeIndex(false);
        this.scheduleCarousel();
        this.sendSocketNotification('CONFIG', this.config);
    },

    /**
     * @function socketNotificationReceived
     * @description Handles incoming messages from node_helper.
     * @override
     *
     * @param {string} notification - Notification name
     * @param {*} payload - Detailed payload of the notification.
     */
    socketNotificationReceived(notification, payload) {
        if (this.types.includes(notification)) {
            this[notification] = payload;
        }

        if (notification === this.getCurrentType()) {
            this.updateDom(0);
        }
    },

    /**
     * @function getStyles
     * @description Style dependencies for this module.
     * @override
     *
     * @returns {string[]} List of the style dependency filepaths.
     */
    getStyles() {
        return ['font-awesome.css', 'MMM-soccer.css'];
    },

    /**
     * @function getTranslations
     * @description Translations for this module.
     * @override
     *
     * @returns {Object.<string, string>} Available translations for this module (key: language code, value: filepath).
     */
    getTranslations() {
        return {
            en: 'translations/en.json',
            de: 'translations/de.json',
            fr: 'translations/fr.json',
            id: 'translations/id.json',
            sv: 'translations/sv.json'
        };
    },

    /**
     * @function getTemplate
     * @description Nunjuck template.
     * @override
     *
     * @returns {string} Path to nunjuck template.
     */
    getTemplate() {
        const {code} = this.config.competitions[this.competitionIndex];
        const type = this.getCurrentType();

        let templateName = 'Standings';

        if (type === 'scorers') {
            templateName = 'TopList';
        } else if (type === 'schedules') {
            templateName = 'Schedules';
        } else if (this[type][code]?.details?.isCup) {
            templateName = 'CupStandings';
        }

        return `templates/${templateName}.njk`;
    },

    /**
     * @function getTemplateData
     * @description Data that gets rendered in the nunjuck template.
     * @override
     *
     * @returns {string} Data for the nunjuck template.
     */
    getTemplateData() {
        const {code} = this.config.competitions[this.competitionIndex];
        const type = this.getCurrentType();

        const {focusEntryIndex, focusGroupIndex, list, details} = this.findFocusAndList();

        const boundaries = this.calculateDisplayBoundaries(list, focusEntryIndex);

        return {
            boundaries: {...boundaries, focusEntryIndex, focusGroupIndex},
            competition: code,
            config: this.config,
            details,
            list,
            type
        };
    },

    getFocusEntryIndex(list = [], focusOn) {
        if (!focusOn) {
            return -1;
        }

        return list.findIndex(entry => entry.team === focusOn || entry.homeTeam === focusOn || entry.awayTeam === focusOn);
    },

    getFirstScheduledEntryIndex(list = []) {
        return list.findIndex(entry => !['FINISHED', 'AWARDED'].includes(entry.status));
    },

    /**
     * @function findFocusTeam
     * @description Helper function to find index of team in standings
     *
     * @returns {Object} Index of team, first and last team to display. focusTeamIndex is -1 if it can't be found.
     */
    findFocusAndList() {
        const {code} = this.config.competitions[this.competitionIndex];
        const competition = this.getCurrentCompetitionConfig();
        const type = this.getCurrentType();

        const data = this[type][code];
        const isCup = data?.details?.isCup;
        const lists = isCup && type === 'standings' ? data?.groups : [data];

        let focusEntryIndex = -1;
        let focusGroupIndex = 0;

        for (let i = 0; i < lists.length; i++) {
            focusEntryIndex = this.getFocusEntryIndex(lists[i]?.list, competition?.focusOn);

            if (focusEntryIndex !== -1) {
                focusGroupIndex = i;
                break;
            }
        }

        if (focusEntryIndex === -1 && type === 'schedules') {
            focusEntryIndex = this.getFirstScheduledEntryIndex(lists[focusGroupIndex]?.list);
        }

        if (focusEntryIndex === -1) {
            if (type === 'schedules') {
                focusEntryIndex = lists[focusGroupIndex]?.list?.length - 1;
            } else {
                focusEntryIndex = 0;
            }
        }

        const details = {...data?.details, ...lists[focusGroupIndex]?.details, };

        return {focusEntryIndex, focusGroupIndex, list: lists[focusGroupIndex]?.list, details};
    },

    /**
     * @function calculateTeamDisplayBoundaries
     * @description Calculates the boundaries of teams based on the config.
     *
     * @returns {Object} Index of team, first and last team to display.
     */
    calculateDisplayBoundaries(list = [], focusEntryIndex) {
        let firstEntry = 0;
        let lastEntry = list.length - 1;

        const competition = this.getCurrentCompetitionConfig();

        if (competition?.maxEntries) {
            const before = parseInt(competition.maxEntries / 2);
            const indexDiff = competition.maxEntries - 1;
            firstEntry = Math.max(focusEntryIndex - before, 0);
            if (firstEntry + indexDiff < list.length) {
                lastEntry = firstEntry + indexDiff;
            } else {
                firstEntry = Math.max(lastEntry - indexDiff, 0);
            }
        }

        return {firstEntry, lastEntry};
    },

    getCurrentCompetitionConfig() {
        return this.config.competitions[this.competitionIndex][this.getCurrentType()];
    },

    getCurrentType() {
        return this.types[this.typeIndex];
    },

    getNextTypeIndex(shift) {
        if (this.config.competitions.length === 0) {
            throw new Error(`${this.name}: Invalid config!`);
        }

        const currentIndex = this.typeIndex + (shift ? 1 : 0);

        for (let i = currentIndex; i <= this.types.length; i++) {
            if (this.config.competitions[this.competitionIndex][this.types[i]]) {
                return i;
            }
        }

        return 0;
    },

    scheduleCarousel() {
        setInterval(() => {
            this.typeIndex = this.getNextTypeIndex(true);

            if (this.typeIndex !== 0) {
                return this.updateDom(300);
            }

            this.competitionIndex++;

            if (this.competitionIndex >= this.config.competitions.length) {
                this.competitionIndex = 0;
            }

            this.typeIndex = this.getNextTypeIndex(false);

            return this.updateDom(300);
        }, this.config.rotationInterval);
    },

    /**
     * @function addFilters
     * @description Adds the filter used by the nunjuck template.
     *
     * @returns {void}
     */
    addFilters() {
        this.nunjucksEnvironment().addFilter('fade', (index, focus) => {
            const competition = this.getCurrentCompetitionConfig();

            if (competition.maxEntries && focus >= 0) {
                if (index !== focus) {
                    const currentStep = Math.abs(index - focus);
                    const percentage = (1 - 1 / competition.maxEntries * currentStep).toFixed(2);

                    return `opacity: ${percentage}`;
                }
            }

            return '';
        });
        this.nunjucksEnvironment().addFilter('formatMatchStart', (timestamp) => {
            const matchStart = new Date(timestamp);
            const oneDay = 1000 * 60 * 60 * 24;
            const remainingTime = matchStart.getTime() - Date.now();

            let options = {month: '2-digit', day: '2-digit'};

            if (remainingTime < oneDay) {
                options = {timeStyle: 'short'};
            } else if (remainingTime < oneDay * 7) {
                options = {weekday: 'short'};
            }

            return new Intl.DateTimeFormat(config.locale, options).format(matchStart);
        });
        this.nunjucksEnvironment().addFilter('prefixTranslate', (text, type) => {
            if (this.config.shortNames) {
                return text;
            }

            const label = `${type.toUpperCase()}_${text}`;

            const translation = this.translate(label);

            return translation !== label ? translation : text;
        });
        this.nunjucksEnvironment().addFilter('icon', (icon) => {
            const iconMapping = {
                standings: 'fa-list-ol',
                schedules: 'fa-calendar-alt',
                scorers: 'fa-soccer-ball-o',
            };

            return iconMapping[icon] || 'fa-question-circle';
        });
    }
});
