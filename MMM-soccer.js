Module.register("MMM-soccer",{
    defaults: {
        api_key: false,
        show: 'GERMANY'
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.leagues = {
            'GERMANY': 394,
            'FRANCE': 396,
            'ENGLAND': 398,
            'SPAIN': 399,
            'ITALY': 401
        };
        this.currentLeague = this.leagues[this.config.show];
        this.getData();
        setInterval(() => {
            this.getData();
        }, this.config.api_key ? 300000 : 1800000); // with api_key every 5min without every 30min
    },

    getData: function(){
        this.sendSocketNotification('GET_DATA', {league: this.currentLeague, api_key: this.config.api_key});
    },

    socketNotificationReceived: function(notification, payload){
        if(notification === 'DATA'){
            this.standing = payload;
            this.updateDom();
        }
    },

    getStyles: function() {
        return ["MMM-soccer.css"];
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        if(this.standing){
            var title = document.createElement("h4");
            title.innerHTML = this.standing.leagueCaption;
            wrapper.appendChild(title);

            var subtitle = document.createElement("p");
            subtitle.classList.add("xsmall");
            subtitle.innerHTML = "Matchday: " + this.standing.matchday;
            wrapper.appendChild(subtitle);

            var rows = document.createElement('div');
            rows.classList.add("xsmall");
            var row = document.createElement('div');
            row.classList.add('row', 'keys');

            var name = document.createElement('div');
            name.classList.add('name');
            name.innerHTML = 'Team';
            row.appendChild(name);

            var details = document.createElement('div');
            details.classList.add('details');

            var points = document.createElement('img');
            points.classList.add('key-icon');
            points.src = 'icons/points.png';
            details.appendChild(points);

            var goals = document.createElement('img');
            goals.classList.add('key-icon');
            goals.src = 'icons/goal.png';
            details.appendChild(goals);
            row.appendChild(details);
            rows.appendChild(row);

            for(var i = 0; i < this.standing.standing.length; i++){
                var row = document.createElement('div');
                row.classList.add('row');

                var icon = document.createElement('img');
                icon.classList.add('icon');
                icon.src = this.standing.standing[i].crestURI;
                row.appendChild(icon);

                var name = document.createElement('div');
                name.classList.add('name');
                name.innerHTML = this.standing.standing[i].teamName;
                row.appendChild(name);

                var details = document.createElement('div');
                details.classList.add('details');

                var points = document.createElement('span');
                points.innerHTML = this.standing.standing[i].points;
                details.appendChild(points);

                var goals = document.createElement('span');
                goals.innerHTML = this.standing.standing[i].goalDifference;
                details.appendChild(goals);
                row.appendChild(details);
                rows.appendChild(row);
            }
            wrapper.appendChild(rows);
        } else {
            wrapper.innerHTML = "No data available";
        }
        return wrapper;
    }
});