var fs = require('fs'),
  http = require('http'),
  url = require('url');

var config = {
  defaultUserName: 'me',
  storageRoot: '/storage/',
  webAuthoringPath: '/public/www/',
  host: 'localhost',
  storagePort: 8000,
  mainPort: 8001,
  portalPort: 8002,
  firstAppPort: 8003,
  apps: {}
};

var server;

function contentTypeFromFilename(fileName) {
  if (fileName.substr(-5) === '.html') {
    return new Buffer('text/html', 'utf-8');
  } else if (fileName.substr(-4) === '.css') {
    return new Buffer('text/css', 'utf-8');
  } else if (fileName.substr(-3) === '.js') {
    return new Buffer('application/javascript', 'utf-8');
  } else {
    return new Buffer('text/plain', 'utf-8');
  }
}

function loadFiles(dir, port, basedir) {
  var list = fs.readdirSync(dir);
  if (!basedir) {
    basedir = dir;
  }
  list.forEach(function(fileName) {
    var filePath = dir + '/' + fileName;
    var pathOnStorage;
    var stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      loadFiles(filePath, port, basedir);
    } else {
     pathOnStorage = config.webAuthoringPath + port.toString() + filePath.substring(basedir.length),
     console.log('loading initial file for port ' + port.toString() + ' from ' + filePath);
      server.backdoorSet(config.defaultUserName,
          pathOnStorage,
          fs.readFileSync(filePath),
          contentTypeFromFilename(fileName),
          function(err, revision) {
            console.log('created', filePath, pathOnStorage, err, revision);
          });
    }
  });
}

function websiteServer(filePath, port) {
  loadFiles(filePath, port);
  return function (req, res) {
    req.url = config.storageRoot + config.defaultUserName + config.webAuthoringPath + port.toString() + req.url;
    if (req.url.substr(-1) === '/') {
      req.url += 'index.html';
    }
    console.log('websiteServer', filePath, port, 'redirected request to ',req.url);
    return serveStorage(req, res);
  };
}

function setApps(listing) {
  for(var i=0; i<listing.length; i++) {
    var listener = websiteServer('./apps/'+listing[i], config.firstAppPort+i);
    http.createServer(listener).listen(config.firstAppPort+i);
    config.apps['http://'+config.host+':'+(config.firstAppPort+i)+'/'] = listing[i];
  }
}

function setPortal() {
  var listener = websiteServer('./portal/', config.portalPort);
  http.createServer(listener).listen(config.portalPort);
}

var kv = (function() {
  var store = {};
  return {
    set: function(k, v, cb) { store[k] = v; cb(); },
    get: function(k, cb) { cb(null, store[k]); }
  };
 })();

function serveMain(req, res) {
  var urlObj = url.parse(req.url, true), userAddress, userName;
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
  console.log(urlObj.pathname);
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
      server = require('./localhost-server').createInstance(kv, config);
      setApps(listing);
      setPortal();
      http.createServer(serveMain).listen(config.mainPort);
      http.createServer(serveStorage).listen(config.storagePort);
      console.log('See http://' + config.host + ':' + config.portalPort + '/'
          + ' or visit a http-hosted, remoteStorage.js-based app and connect with me@localhost:'+ config.mainPort + ' (special backdoor!)');
    }
  });
}

//...
launch();
