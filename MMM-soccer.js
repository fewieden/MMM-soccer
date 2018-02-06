/* global Module Log */

/* Magic Mirror
 * Module: MMM-soccer
 *
 * By fewieden https://github.com/fewieden/MMM-soccer
 *
 * MIT Licensed.
 */

Module.register('MMM-soccer', {

    icon_fixes: {
        '1. FSV Mainz 05': 'https://upload.wikimedia.org/wikipedia/commons/d/d6/FSV_Mainz_05_Logo.png',
		'FC Bayern München': 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Logo_FC_Bayern_M%C3%BCnchen_%282002%E2%80%932017%29.svg',
		'SPAL Ferrara': 'https://upload.wikimedia.org/wikipedia/de/e/e7/SPAL_Ferrara.svg',
		'Benevento Calcio': 'https://upload.wikimedia.org/wikipedia/de/4/48/Benevento_Calcio_Logo.svg'
    },

    defaults: {
        api_key: false,
        colored: false,
        show: 'GERMANY',
        focus_on: false,  // false or the name of a team to focus on (used with max_teams)
        max_teams: false,   // false or the number of teams to show either side of the focused team
        leagues: {
            GERMANY: 452,
            FRANCE: 450,
            ENGLAND: 445,
            SPAIN: 455,
            ITALY: 456
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

    // A loading boolean.
    loading: true,

    // Subclass start method.
    start() {
        Log.info(`Starting module: ${this.name}`);
        this.currentLeague = this.config.leagues[this.config.show];
        this.getData();
        setInterval(() => {
            this.getData();
        }, this.config.api_key ? 300000 : 1800000); // with api_key every 5min without every 30min
    },

    getData() {
        this.sendSocketNotification('GET_DATA', { league: this.currentLeague, api_key: this.config.api_key });
    },

    // Subclass socketNotificationReceived method.
    socketNotificationReceived(notification, payload) {
        if (notification === 'DATA') {
            this.standing = payload;
            this.loading = (!this.standing);
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

    // Subclass getStyles method.
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

    handleModals(data, modal, open, close) {
        if (close.test(data) || (this.modals[modal] && !open.test(data))) {
            this.closeAllModals();
        } else if (open.test(data) || (!this.modals[modal] && !close.test(data))) {
            this.closeAllModals();
            this.modals[modal] = true;
        }
    },

    closeAllModals() {
        const modals = Object.keys(this.modals);
        modals.forEach(modal => (this.modals[modal] = false));
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
        return (this.config.max_teams && this.config.max_teams <= this.standing.standing.length);
    },

    // Override dom generator.
    getDom() {
        const wrapper = document.createElement('div');
        const standings = document.createElement('div');

        const title = document.createElement('header');
        title.innerHTML = this.standing ? this.standing.leagueCaption : this.name;
        standings.appendChild(title);

        const subtitle = document.createElement('div');
        subtitle.classList.add('xsmall');
        subtitle.innerHTML = this.standing ?
            `${this.translate('MATCHDAY')}: ${this.standing.matchday}` : this.translate('LOADING');
        standings.appendChild(subtitle);

        // Generate Standings Table
        if (this.standing) {
            // Standings container
            const table = document.createElement('table');
            table.classList.add('xsmall', 'table');

            // Standings header row
            table.appendChild(this.createLabelRow());

            // Get First and Last teams to display in standings
            let focusTeamIndex;
            let firstTeam;
            let lastTeam;

            /* focus_on for current league is set */
            if (this.config.focus_on && Object.prototype.hasOwnProperty.call(this.config.focus_on, this.config.show)) {
                /* focus_on TOP */
                if (this.config.focus_on[this.config.show] === 'TOP') {
                    focusTeamIndex = -1;
                    firstTeam = 0;
                    lastTeam = this.isMaxTeamsLessAll() ? this.config.max_teams : this.standing.standing.length;
                } else if (this.config.focus_on[this.config.show] === 'BOTTOM') {
                    focusTeamIndex = -1;
                    firstTeam = this.isMaxTeamsLessAll() ? this.standing.standing.length - this.config.max_teams : 0;
                    lastTeam = this.standing.standing.length;
                } else {
                    for (let i = 0; i < this.standing.standing.length; i += 1) {
                        /* focus_on is teamName */
                        if (this.standing.standing[i].teamName === this.config.focus_on[this.config.show]) {
                            focusTeamIndex = i;
                            /* max_teams is set */
                            if (this.config.max_teams) {
                                const before = parseInt(this.config.max_teams / 2);
                                firstTeam = focusTeamIndex - before >= 0 ? focusTeamIndex - before : 0;
                                /* index for lastTeam is in range */
                                if (firstTeam + this.config.max_teams <= this.standing.standing.length) {
                                    lastTeam = firstTeam + this.config.max_teams;
                                } else {
                                    lastTeam = this.standing.standing.length;
                                    firstTeam = lastTeam - this.config.max_teams >= 0 ?
                                        lastTeam - this.config.max_teams : 0;
                                }
                            } else {
                                firstTeam = 0;
                                lastTeam = this.standing.standing.length;
                            }
                            break;
                        }
                    }
                }
            } else {
                focusTeamIndex = -1;
                firstTeam = 0;
                lastTeam = this.config.max_teams || this.standing.standing.length;
            }

            // Render Team Rows
            for (let i = firstTeam; i < lastTeam; i += 1) {
                table.appendChild(this.createDataRow(this.standing.standing[i], i, focusTeamIndex, false));
            }
            standings.appendChild(table);

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

            if (this.isModalActive()) {
                standings.classList.add('MMM-soccer-blur');
                const modal = document.createElement('div');
                modal.classList.add('modal');
                if (this.modals.standings) {
                    const expandedTable = document.createElement('table');
                    expandedTable.classList.add('small', 'table');
                    expandedTable.appendChild(this.createLabelRow());

                    for (let i = 0; i < this.standing.standing.length; i += 1) {
                        expandedTable.appendChild(
                            this.createDataRow(this.standing.standing[i], i, focusTeamIndex, true)
                        );
                    }
                    modal.appendChild(expandedTable);
                } else {
                    this.appendHelp(modal);
                }
                wrapper.appendChild(modal);
            }
        }

        wrapper.appendChild(standings);

        return wrapper;
    },

    createLabelRow() {
        const labelRow = document.createElement('tr');
        labelRow.classList.add('row');

        const position = document.createElement('th');
        labelRow.appendChild(position);

        const logo = document.createElement('th');
        labelRow.appendChild(logo);

        const name = document.createElement('th');
        name.classList.add('name');
        name.innerHTML = this.translate('TEAM');
        labelRow.appendChild(name);

        const pointsLabel = document.createElement('th');
        pointsLabel.classList.add('centered');
        const points = document.createElement('i');
        points.classList.add('fa', 'fa-line-chart');
        pointsLabel.appendChild(points);
        labelRow.appendChild(pointsLabel);

        const goalsLabel = document.createElement('th');
        goalsLabel.classList.add('centered');
        const goals = document.createElement('i');
        goals.classList.add('fa', 'fa-soccer-ball-o');
        goalsLabel.appendChild(goals);
        labelRow.appendChild(goalsLabel);

        return labelRow;
    },

    createDataRow(data, index, focus, expand) {
        const row = document.createElement('tr');
        row.classList.add('centered-row');
        if (index === focus) {
            row.classList.add('bright');
        }

        const pos = document.createElement('td');
        pos.innerHTML = data.position;
        row.appendChild(pos);

        const logo = document.createElement('td');
        const icon = document.createElement('img');
        icon.classList.add('icon');
        if (data.crestURI !== 'null') {
            icon.src = data.crestURI;   // API returns 'null' for teams without a crest
        }
        if (Object.prototype.hasOwnProperty.call(this.icon_fixes, data.teamName)) {
            icon.src = this.icon_fixes[data.teamName];
        }
        if (!this.config.colored) {
            icon.classList.add('no-color');
        }
        logo.appendChild(icon);
        row.appendChild(logo);

        const name = document.createElement('td');
        name.classList.add('name');
        name.innerHTML = data.teamName;
        row.appendChild(name);

        const points = document.createElement('td');
        points.innerHTML = data.points;
        points.classList.add('centered');
        row.appendChild(points);

        const goals = document.createElement('td');
        goals.innerHTML = data.goalDifference;
        goals.classList.add('centered');
        row.appendChild(goals);

        // Create fade in/out effect.
        if (!expand && this.config.max_teams && focus >= 0) {
            if (index !== focus) {
                const currentStep = Math.abs(index - focus);
                row.style.opacity = 1 - ((1 / this.config.max_teams) * currentStep);
            }
        }

        return row;
    },

    appendHelp(appendTo) {
        const title = document.createElement('h1');
        title.classList.add('medium');
        title.innerHTML = `${this.name} - ${this.translate('COMMAND_LIST')}`;
        appendTo.appendChild(title);

        const mode = document.createElement('div');
        mode.innerHTML = `${this.translate('MODE')}: ${this.voice.mode}`;
        appendTo.appendChild(mode);

        const listLabel = document.createElement('div');
        listLabel.innerHTML = `${this.translate('VOICE_COMMANDS')}:`;
        appendTo.appendChild(listLabel);

        const list = document.createElement('ul');
        for (let i = 0; i < this.voice.sentences.length; i += 1) {
            const item = document.createElement('li');
            item.innerHTML = this.voice.sentences[i];
            list.appendChild(item);
        }
        appendTo.appendChild(list);
    }
});
