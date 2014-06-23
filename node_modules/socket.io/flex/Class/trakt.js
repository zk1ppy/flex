var http = require('http');
module.exports = trakt;

function trakt (url,username) {
        this.url = url;
        this.connected = false;
        this.apiKey = '9f7de9d82a13b031d2a19f907a0e9c82';
        this.username = username;

        this.fetch = function(path,headers,method,postData,callback){
                var options = {
                        //host: "dumbledore.actimage.int",
                        //path: "http://" + this.url + path,
                        host: this.url,
                        path: path,
                        port: 80,
                        method: method,
                        headers: headers
                };
                var request = http.request(options, function(response) {
                        response.setEncoding('utf-8');
                        var responseString = '';
                        response.on('data', function(data) {
                                responseString += data;
                        });
                        response.on('end', function() {
                                callback(responseString);
                        });
                        response.on('error', function(e) {
                                console.log('problem with request: ' + e.message);
                        });
                });
                if(method="POST"){request.write(postData)};
                request.end();
        };
}

trakt.prototype.comingNextShow = function(date,history,callback){
        var headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
        };
        console.log('/user/calendar/shows.json/' + this.apiKey + '/' + this.username + '/' + date + '/' + history);
        this.fetch('/user/calendar/shows.json/' + this.apiKey + '/' + this.username + '/' + date + '/' + history, headers, "GET", '', function(data){
                var resultObject = JSON.parse(data);
                callback(resultObject);
        });
}

trakt.prototype.getUserMovieCollection = function(callback){
        var headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
        };
        this.fetch('/user/library/movies/collection.json/' + this.apiKey + '/' + this.username, headers, 'GET','', function(collection){
                callback(JSON.parse(collection));
        });
};

trakt.prototype.collected = function(name, season, number, callback){
        var headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
        };
        var url = '/user/progress/collected.json/' + this.apiKey + '/' + this.username + '/' + name;
        this.fetch(url, headers, "GET", '', function(result){
                if(result){
                        var resultObject = JSON.parse(result);
                        if(resultObject[0]){
                                //console.log(resultObject[0]);
                                //g▒rer les ▒pisodes sp▒ciaux (hors saison)
                                callback(resultObject[0].seasons[season - 1].episodes[number], '');
                        }
                        else{
                                callback('','Not found');
                        }
                }
        });
}

trakt.prototype.getUserMovieWatchlist = function(callback){
        var headers = {
                        'Content-Type': 'application/x-www-form-urlencoded'
                };
                var url = '/user/watchlist/movies.json/' + this.apiKey + '/' + this.username;
                this.fetch(url, headers, "GET", '', function(result){
                        if(result){
                                var resultObject = JSON.parse(result);
                                if(resultObject){
                                        //console.log(resultObject[0]);
                                        callback(resultObject);
                                }
                        }
                });
}
