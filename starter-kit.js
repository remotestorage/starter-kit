var fs = require('fs'),
  http = require('http'),
  url = require('url'),
  static = require('node-static');

var config = {
  defaultUserName: 'me',
  host: 'localhost',
  storagePort: 8000,
  portalPort: 80,
  firstAppPort: 8002,
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
    set: function(k, v, cb) { store[k] = v; cb(); },
    get: function(k, cb) { cb(null, store[k]); }
  };
 })();

var server;

function serveMain(req, res) {
  var urlObj = url.parse(req.url, true), userAddress, userName;
  console.log(urlObj);
  if(urlObj.pathname == '/') {
    server.portal(req, res);
  } else if(urlObj.pathname == '/.well-known/webfinger') {
    server.webfinger(req, res);
  } else if(urlObj.pathname.substring(0, '/auth/'.length) == '/auth/') {
    server.oauth(req, res);
  } else {
    res.writeHead(404);
    res.end();
  }
}

function serveStorage(req, res) {
  var urlObj = url.parse(req.url, true), userAddress, userName;
  console.log(urlObj);
  if(urlObj.pathname.substring(0, '/storage/'.length) == '/storage/') {
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
      http.createServer(serveMain).listen(config.portalPort);
      http.createServer(serveStorage).listen(config.storagePort);
      console.log('See http://' + config.host + ':' + config.portalPort + '/'
          + ' or visit a remoteStorage.js 0.10+ app and connect with me@localhost:'+ config.portalPort + ' (special backdoor!)');
    }
  });
}

//...
launch();
