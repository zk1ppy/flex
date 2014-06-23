var t411 = require("./Class/t411.js");
var trakt = require("./Class/trakt.js");
var path = require('path');
var config = require('./config.js');

var flex = {
        showList: [],
        newshowList: [],
        torrentList: [],
        movieList: [],
        newMovieList: [],
        movieCollection: [],

        trackerOptions: {
                season: '',
                episode: '',
                quality: 'SD',
                language: 'VOSTFR'
        },

        fetchShowList: function() {
                var history = 7;
                trakt.comingNextShow(this.getDateYYYYMMDD(history) ,history, this.onShowList.bind(this));
        },

        getDateYYYYMMDD: function(history) {
                var myDate = new Date();
                myDate.setHours(myDate.getHours() - (history*24));

                var myMonth = myDate.getMonth() + 1;
                if( myMonth < 10){
                        myMonth = "0" + (myDate.getMonth()+1);
                }
                var myDay = myDate.getDate();
                if( myDay < 10){
                        myDay = "0" + (myDate.getDate());
                }
                var myYear = "" + myDate.getFullYear();
                return "" + myYear + myMonth + myDay;
        },

        extractShows: function(episodes) {
                for(var i = 0; i<episodes.length; ++i) {
                        var episode = {
                                        name:   episodes[i].show.title,
                                        season: episodes[i].episode.season,
                                        number: episodes[i].episode.number,
                                        imdbID: episodes[i].show.imdb_id
                        };
                        console.log("Last episodes : ", episode.name + " (s" + episode.season + "x" + episode.number + ")");
                        this.showList.push(episode);
                }
        },

        onShowList: function(showList) {
                for(var day=0; day<showList.length; ++day){
                        this.extractShows(showList[day].episodes);
                }
                this.checkIsCollected();
        },

        checkIsCollected: function() {
                if (this.showList.length) {
                        var episode = this.showList.pop();
                        trakt.collected(episode.imdbID, episode.season, episode.number, this.isShowDownloaded.bind(this, episode));
                }
                else{
                        this.checkShowOnTracker();
                }

        },

        isShowDownloaded: function(episode, collected) {
                if(!collected){
                        console.log("Episode not collected : ", episode.name + " (s" + episode.season + "x" + episode.number + ")");
                        this.newshowList.push(episode);
                }
                this.checkIsCollected();
        },

        checkShowOnTracker: function(){
                if(this.newshowList.length){
                        var episode = this.newshowList.pop();
                        this.trackerOptions.season = episode.season;
                        this.trackerOptions.episode = episode.number;
                        t411.searchTVShow(episode.name.replace(/[^\w\s]/gi, ''), this.trackerOptions, this.ListTorrents.bind(this, episode));
                }
                else{
                        this.downloadTorrents();
                }
        },

        ListTorrents: function(episode, torrent){
                if(torrent){
                        var newTorrent = {
                                        show: episode.name,
                                        season: episode.season,
                                        episode: episode.number,
                                        name: torrent.name,
                                        id: torrent.id
                        };
                        this.torrentList.push(newTorrent);
                        console.log("Torrent to download : ", newTorrent.name);
                }
                else{
                        console.log('Torrent not found : %j', episode.name + ' s' + episode.season + 'e' + episode.number);
                }
                this.checkShowOnTracker();
        },

        downloadTorrents: function(){
                if(this.torrentList.length){
                        var torrent = this.torrentList.pop();
                        t411.downloadTorrent(torrent.id, this.addToDeluge.bind(this, torrent));
                }
                else{
                        console.log("All done ...");
                }
        },

        addToDeluge: function(torrent, filename){
                var deluge_add = require('./Class/deluge-web.js');
                var deluge_url = config.deluge.url;
                var magnet_url = path.resolve(filename);
                var password = config.deluge.password;
                var download_location = config.showPath + torrent.show + '/S' + torrent.season + '/';

                deluge_add(deluge_url, password, magnet_url, download_location, function(err, result){
                        if(err){
                                console.log(err);
                        }
                });
                console.log("Adding to deluge : ", filename);
                this.downloadTorrents();
        },

        fetchMovieWatchlist: function(){
                trakt.getUserMovieWatchlist(this.onMovieList.bind(this));
        },

        onMovieList: function(movieList){
                for(var i = 0; i < movieList.length; ++i){
                        var movie = {
                                        name: movieList[i].title,
                                        imdbID: movieList[i].imdb_id,
                                        year: movieList[i].year,
                                        collected: true
                        };
                        this.newMovieList.push(movie);
                        //console.log("Movie to see : %j", movie.name);
                }
                this.checkMovieCollected();
        },

        checkMovieCollected: function(){
                for(var i = 0; i < this.newMovieList.length; ++i){
                        var downloaded = this.searchCollection(this.movieCollection, this.newMovieList[i].name);
                        if(!downloaded){
                                console.log("Movie to download: %j", this.newMovieList[i].name);
                                this.newMovieList[i].collected = false;
                        }
                }
                this.addMovieToDownload();
                //console.log(this.newMovieList);
        },

        getMyMovieCollectionCall: function(){
                trakt.getUserMovieCollection(this.getMyMovieCollection.bind(this));
        },

        getMyMovieCollection: function(result){
                this.movieCollection = result;
                this.fetchMovieWatchlist();
        },

        searchCollection: function(collection, title){
                var output = collection.filter(function(element){return element.title==title});
                if(output.length){
                        return true;
                }
                else {
                        return false;
                }

        },

        addMovieToDownload: function(){
        for(var i = 0; i < this.newMovieList.length; ++i){
            if(!this.newMovieList[i].collected){
                t411.searchMovie(this.newMovieList[i].name.replace(/[^\w\s]/gi, ''), this.trackerOptions, this.ListTorrents.bind(this));
            }
        }
        },

};

var t411 = new t411(config.t411.url);
var t411User = {
    username: config.t411.user,
    password: config.t411.password,
}
t411.login(t411User,function(){});
var trakt = new trakt(config.trakt.url,config.trakt.username);

//flex.getMyMovieCollectionCall();

flex.fetchShowList();
