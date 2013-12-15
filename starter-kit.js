var fs = require('fs'),
  http = require('http'),
  url = require('url'),
  static = require('node-static');

var config = {
  defaultUserName: 'me',
  host: 'localhost',
  firstAppPort: 8001,
  apps: {}
};

function staticServer(path) {
  var file = new static.Server(path);
  return function (req, res) {
    req.addListener('end', function () {
      file.serve(req, res);
    }).resume();
  };
}

function setApps(listing) {
  for(var i=0; i<listing.length; i++) {
    var listener = staticServer('./apps/'+listing[i]);
    http.createServer(listener).listen(config.firstAppPort+i);
    config.apps['http://localhost:'+(config.firstAppPort+i)+'/'] = listing[i];
  }
}
  
var kv = (function() {
  var store = {};
  return {
    set: function(k, v) { store[k] = v; },
    get: function(k) { return store[k]; }
  };
 })();

var server;

function serve(req, res) {
  var urlObj = url.parse(req.url, true), userAddress, userName;
  console.log(urlObj);
  if(urlObj.pathname == '/') {
    server.portal(req, res);
  } else if(urlObj.pathname == '/.well-known/webfinger') {
    server.webfinger(req, res);
  } else if(urlObj.pathname.substring(0, '/auth/'.length) == '/auth/') {
    server.oauth(req, res);
  } else if(urlObj.pathname.substring(0, '/storage/'.length) == '/storage/') {
    server.storage(req, res);
  } else {
    res.writeHead(404);
    res.end();
  }
}

function launch() {
  fs.readdir('./apps/', function(err, listing) {
    if(err) {
      console.log('make sure ./apps/ exists');
    } else {
      setApps(listing);
      server = require('./localhost-server').createInstance(kv, config);
      http.createServer(serve).listen(80, function(){
        console.log('See http://' + config.host + '/');
      });
    }
  });
}

//...
launch();