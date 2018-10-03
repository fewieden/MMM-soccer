/* global Module Log */

/* Magic Mirror
 * Module: MMM-soccer
 *
 * By fewieden https://github.com/fewieden/MMM-soccer
 *
 * MIT Licensed.
 */

Module.register('MMM-soccer', {
    defaults: {
        api_key: false,
        colored: false,
        show: 'GERMANY',
        focus_on: false,
        max_teams: false,
        logos: false,
        leagues: {
            GERMANY: 2002,
            FRANCE: 2015,
            ENGLAND: 2021,
            SPAIN: 2014,
            ITALY: 2019
        }
    },

    modals: {
        standings: false,
        help: false
    },

    voice: {
        mode: 'SOCCER',
        sentences: [
            'OPEN HELP',
            'CLOSE HELP',
            'SHOW STANDINGS OF COUNTRY NAME',
            'EXPAND VIEW',
            'COLLAPSE VIEW'
        ]
    },

    loading: true,
    standing: [],
    competition: {},

    start() {
        Log.info(`Starting module: ${this.name}`);
        this.addFilters();
        this.currentLeague = this.config.leagues[this.config.show];
        this.getData();
        setInterval(() => {
            this.getData();
        }, this.config.api_key ? 300000 : 1800000); // with api_key every 5min without every 30min
    },

    getData() {
        this.sendSocketNotification('GET_DATA', { league: this.currentLeague, api_key: this.config.api_key });
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'DATA') {
            this.standing = payload.standings[0].table;
            this.season = payload.season;
            this.competition = payload.competition;
            this.loading = false;
            this.updateDom();
        }
    },

    notificationReceived(notification, payload, sender) {
        if (notification === 'ALL_MODULES_STARTED') {
            const voice = Object.assign({}, this.voice);
            voice.sentences.push(Object.keys(this.config.leagues).join(' '));
            this.sendNotification('REGISTER_VOICE_MODULE', voice);
        } else if (notification === 'VOICE_SOCCER' && sender.name === 'MMM-voice') {
            this.checkCommands(payload);
        } else if (notification === 'VOICE_MODE_CHANGED' && sender.name === 'MMM-voice'
            && payload.old === this.voice.mode) {
            this.closeAllModals();
            this.updateDom(300);
        }
    },

    getStyles() {
        return ['font-awesome.css', 'MMM-soccer.css'];
    },

    getTranslations() {
        return {
            en: 'translations/en.json',
            de: 'translations/de.json',
            id: 'translations/id.json'
        };
    },

    getTemplate() {
        return 'MMM-soccer.njk';
    },

    getTemplateData() {
        return {
            boundaries: this.calculateTeamDisplayBoundaries(),
            competitionName: this.competition.name || this.name,
            config: this.config,
            isModalActive: this.isModalActive(),
            modals: this.modals,
            season: this.season ?
                `${this.translate('MATCHDAY')}: ${this.season.currentMatchday || 'N/A'}` : this.translate('LOADING'),
            standing: this.standing,
            voice: this.voice
        };
    },

    handleModals(data, modal, open, close) {
        if (close.test(data) || (this.modals[modal] && !open.test(data))) {
            this.closeAllModals();
        } else if (open.test(data) || (!this.modals[modal] && !close.test(data))) {
            this.closeAllModals();
            this.modals[modal] = true;
        }

        const modules = document.querySelectorAll('.module');
        for (let i = 0; i < modules.length; i += 1) {
            if (!modules[i].classList.contains('MMM-soccer')) {
                if (this.isModalActive()) {
                    modules[i].classList.add('MMM-soccer-blur');
                } else {
                    modules[i].classList.remove('MMM-soccer-blur');
                }
            }
        }
    },

    closeAllModals() {
        const modals = Object.keys(this.modals);
        modals.forEach((modal) => { this.modals[modal] = false; });
    },

    isModalActive() {
        const modals = Object.keys(this.modals);
        return modals.some(modal => this.modals[modal] === true);
    },

    checkCommands(data) {
        if (/(HELP)/g.test(data)) {
            this.handleModals(data, 'help', /(OPEN)/g, /(CLOSE)/g);
        } else if (/(VIEW)/g.test(data)) {
            this.handleModals(data, 'standings', /(EXPAND)/g, /(COLLAPSE)/g);
        } else if (/(STANDINGS)/g.test(data)) {
            const countrys = Object.keys(this.config.leagues);
            for (let i = 0; i < countrys.length; i += 1) {
                const regexp = new RegExp(countrys[i], 'g');
                if (regexp.test(data)) {
                    this.closeAllModals();
                    if (this.currentLeague !== this.config.leagues[countrys[i]]) {
                        this.currentLeague = this.config.leagues[countrys[i]];
                        this.getData();
                    }
                    break;
                }
            }
        }
        this.updateDom(300);
    },

    isMaxTeamsLessAll() {
        return (this.config.max_teams && this.config.max_teams <= this.standing.length);
    },

    findFocusTeam() {
        let focusTeamIndex;

        for (let i = 0; i < this.standing.length; i += 1) {
            if (this.standing[i].team.name === this.config.focus_on[this.config.show]) {
                focusTeamIndex = i;
                break;
            }
        }

        const { firstTeam, lastTeam } = this.getFirstAndLastTeam(focusTeamIndex);

        return { focusTeamIndex, firstTeam, lastTeam };
    },

    getFirstAndLastTeam(index) {
        let firstTeam;
        let lastTeam;

        if (this.config.max_teams) {
            const before = parseInt(this.config.max_teams / 2);
            firstTeam = index - before >= 0 ? index - before : 0;
            if (firstTeam + this.config.max_teams <= this.standing.length) {
                lastTeam = firstTeam + this.config.max_teams;
            } else {
                lastTeam = this.standing.length;
                firstTeam = lastTeam - this.config.max_teams >= 0 ?
                    lastTeam - this.config.max_teams : 0;
            }
        } else {
            firstTeam = 0;
            lastTeam = this.standing.length;
        }

        return { firstTeam, lastTeam };
    },

    calculateTeamDisplayBoundaries() {
        if (this.config.focus_on && Object.prototype.hasOwnProperty.call(this.config.focus_on, this.config.show)) {
            if (this.config.focus_on[this.config.show] === 'TOP') {
                return {
                    focusTeamIndex: -1,
                    firstTeam: 0,
                    lastTeam: this.isMaxTeamsLessAll() ? this.config.max_teams : this.standing.length
                };
            } else if (this.config.focus_on[this.config.show] === 'BOTTOM') {
                return {
                    focusTeamIndex: -1,
                    firstTeam: this.isMaxTeamsLessAll() ? this.standing.length - this.config.max_teams : 0,
                    lastTeam: this.standing.length
                };
            }

            return this.findFocusTeam();
        }

        return {
            focusTeamIndex: -1,
            firstTeam: 0,
            lastTeam: this.config.max_teams || this.standing.length
        };
    },

    addFilters() {
        this.nunjucksEnvironment().addFilter('fade', (index, focus) => {
            if (this.config.max_teams && focus >= 0) {
                if (index !== focus) {
                    const currentStep = Math.abs(index - focus);
                    return `opacity: ${1 - ((1 / this.config.max_teams) * currentStep)}`;
                }
            }

            return '';
        });
    }
});
