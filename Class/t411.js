var querystring = require("querystring");
var http = require('http');

module.exports = t411;

function t411 (url) {
    this.url=url;
    this.connected = false;
    this.token='';
    this.fetch = function(path,headers,method,postData,callback){
        var options = {
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
        if( method == "POST" ){
            request.write(postData);
        }
        request.end();
    };
    this.fetchFile = function(uri,headers,callback){
        var path = require('path');
        var fs = require("fs");
        var options = {
            host: this.url,
            path: uri,
            headers: headers
        };

        var file = fs.createWriteStream(__dirname + "/../tmp/" + path.basename(uri) + ".torrent");
        http.get(options, function(response) {
            response.pipe(file);
            callback(true);
        });
    };
}

t411.prototype.logged = function(){
    return this.connected;
};

t411.prototype.login = function(user,callback){
    var self=this;
    var userString = querystring.stringify(user);
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': userString.length,
    };

    this.fetch("/auth",headers,"POST",userString,function(data){
        var resultObject = JSON.parse(data);
        self.token=resultObject.token;
    
        if(self.token){
            self.connected = true;
            callback(self.connected);
        }
        else{
            callback(self.connected);
        }
    });
};

t411.prototype.searchTVShow = function(show,options,callback) {
    var term = '';
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization' : this.token
    };
    if(options.season){
        term = term + '&term[45][]=' + (967 + options.season);
    }
    if(options.episode){
        if( options.episode < 9) {
                term = term + '&term[46][]=' + (936 + options.episode);
        }
        else{
                term = term + '&term[46][]=' + (937 + options.episode);
        }
    }
    if(options.quality){
        switch(options.quality){
            case 'SD':
                term = term + '&term[7][]=11';
                break;
            case '720p':
                term = term + '&term[7][]=12';
                break;
            case '1080p':
                term = term + '&term[7][]=1162';
                break;
        }
    }
    if(options.language){
        switch(options.language){
            case 'VOSTFR':
                term = term + '&term[17][]=721'
                break;
            case 'VO':
                term = term + '&term[17][]=540'
                break;
            case 'FR':
                term = term + '&term[17][]=541';
                break;
        }
    }
    var uri = "/torrents/search/" + show + "?cat=433";
    //console.log(uri+term);
    
    this.fetch(uri + term, headers, "GET", '', function(data){
        var resultObject = JSON.parse(data);
        //console.log(resultObject);
        if(resultObject.total == '1'){
            callback(resultObject.torrents[0]);
        }
        else if( resultObject.torrents ) {
            var temp = '';
            for( var i = 0; i < resultObject.torrents.length; ++i){
                if( resultObject.torrents[i].name.indexOf('x264') > -1 ){
                    temp = resultObject.torrents[i];
                }
            }
            if(temp !== ''){
                callback(temp);
            }
            else{
                callback(resultObject.torrents[0]);
            }
        }
        else{
            callback(false);
        }
    });
};

t411.prototype.searchMovie = function(movie,options,callback) {
    var term = '';
    var headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : this.token
    };
    if(options.quality){
        switch(options.quality){
            case 'SD':
                term = term + '&term[7][]=11';
                break;
            case '720p':
                term = term + '&term[7][]=12';
                break;
            case '1080p':
                term = term + '&term[7][]=1162';
                break;
        }
    }
    if(options.language){
        switch(options.language){
            case 'VOSTFR':
                term = term + '&term[17][]=721';
                break;
            case 'VO':
                term = term + '&term[17][]=540';
                break;
            case 'FR':
                term = term + '&term[17][]=541';
                break;
        }
    }
    var uri = "/torrents/search/" + movie + "?cat=631";

    this.fetch(uri + term, headers, "GET", '', function(data){
                var resultObject = JSON.parse(data);
                //console.log(resultObject);
                if(resultObject.total == '1'){
                        callback(resultObject.torrents[0]);
                }
                else{
                        var temp = '';
                        for(var i = 0; i<resultObject.torrents.length; ++i){
                                if( resultObject.torrents[i].name.indexOf('x264') > -1 ){
                                        temp = resultObject.torrents[i];
                                }
                        }
                        if(temp !== ''){
                                callback(temp);
                        }
                        else{
                                callback(resultObject.torrents[0]);
                        }
                }
        });
}

t411.prototype.selectTorrent = function(list,callback){
        for(var i = 0; i<list.length; ++i){
                this.getTorrentInfo(list[i].id,function(torrent){
                        //console.log(torrent.name + "-" + torrent.terms['SérieTV - Episode']);
                });
        }
};

t411.prototype.searchMovie = function(value,callback) {
        var headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : this.token
        };
        this.fetch("/torrents/search/"+value,headers,"GET",'',function(data){
                var resultObject = JSON.parse(data);
                //console.log(resultObject);
        });
};

t411.prototype.getTorrentInfo = function(torrentID,callback) {
        var headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : this.token
        };
        this.fetch("/torrents/details/"+torrentID,headers,"GET",'',function(data){
                var resultObject = JSON.parse(data);
                callback(resultObject);
        });
};

t411.prototype.getT411Terms = function(cat,callback) {
        var headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : this.token
        };
        this.fetch("/terms/tree",headers,"GET",'',function(data){
                var resultObject = JSON.parse(data);
                callback(resultObject[cat]);
        });
};

t411.prototype.downloadTorrent = function(id,callback){
        var headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : this.token
        };
        this.fetchFile("/torrents/download/" + id, headers,function(status){
                callback(__dirname + "/../tmp/" + id + ".torrent");
        });
};