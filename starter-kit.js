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
  firstCloningPort: 1024,
  lastCloningPort: 1034,
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

function loadFiles(dir, port, basedir, callback) {
  var list = fs.readdirSync(dir),
    assets = [], numToDo = list.length;
  if (!basedir) {
    basedir = dir;
  }
  function doneOne() {
    numToDo--;
    if (numToDo ===0) {
      callback(assets);
    }
  }
  list.forEach(function(fileName) {
    var filePath = dir + '/' + fileName;
    var pathOnStorage;
    var stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      loadFiles(filePath, port, basedir, function(subAssets) {
        for(var i =0; i<subAssets.length; i++) {
          assets.push(filePath + '/' + subAssets[i]);
        }
        doneOne();
      });
    } else {
     pathOnStorage = config.webAuthoringPath + port.toString() + filePath.substring(basedir.length),
      server.backdoorSet(config.defaultUserName,
          pathOnStorage,
          fs.readFileSync(filePath),
          contentTypeFromFilename(fileName),
          function(err, revision) {
            assets.push(filePath);
            doneOne();
          });
    }
  });
}

function websiteServer(filePath, port, callback) {
  if(filePath) {
    loadFiles(filePath, port, undefined, callback);
  }//else it will be empty until an app uses the www
  //module to store a cloned app for that port.

  return function (req, res) {
    req.url = config.storageRoot + config.defaultUserName + config.webAuthoringPath + port.toString() + req.url;
    if (req.url.substr(-1) === '/') {
      req.url += 'index.html';
    }
    return serveStorage(req, res);
  };
}

function setApps(listing) {
  server.backdoorSet(config.defaultUserName,
    '/apps/channel-url',
    new Buffer('https://apps.unhosted.org/defaultApps.json', 'utf-8'),
    new Buffer('application/json', 'utf-8'),
    function(err, revision) {
      console.log('channel url stored stored', '/apps/channel-url');
    }
  );
  for(var i=0; i<listing.length; i++) {
    var listener = websiteServer('./apps/'+listing[i], config.firstAppPort+i, function(bindName, bindPort) {
      return function(assets) {
        server.backdoorSet(config.defaultUserName,
          '/apps/' + bindName + '.manifest',
          new Buffer(JSON.stringify({
            name: bindName,
            href: 'http://localhost:' + bindPort + '/',
            img: 'http://localhost:' + bindPort + '/icon_x128.png',
            assets: assets,
            cloned: true
          }), 'utf-8'),
          new Buffer('application/json', 'utf-8'),
          function(err, revision) {
            console.log('manifest stored', '/apps/' + bindName + '.manifest');
          }
        );
      };
    }(listing[i], config.firstAppPort+i));
    http.createServer(listener).listen(config.firstAppPort+i);
    config.apps['http://'+config.host+':'+(config.firstAppPort+i)+'/'] = listing[i];
  }
}

function prepareCloningPorts() {
  for(var i=config.firstCloningPort; i <= config.lastCloningPort; i++) {
    var listener = websiteServer(undefined, i, function() {});
    http.createServer(listener).listen(i);
  }
}

function setPortal() {
  var listener = websiteServer('./portal', config.portalPort, function(portalAssets) {
  });
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
      console.log('Loading files from the "apps/" folder into the "apps" and "www" modules:');
      server = require('./localhost-server').createInstance(kv, config);
      setApps(listing);
      prepareCloningPorts();
      setPortal();
      http.createServer(serveMain).listen(config.mainPort);
      http.createServer(serveStorage).listen(config.storagePort);
      console.log('\nSee http://' + config.host + ':' + config.portalPort + '/\n'
          + '\nor visit a http-hosted, remoteStorage.js-based app and connect with me@localhost:'+ config.mainPort
          + '\n(special backdoor, does not work from https-hosted apps!)\n'
          + '\nNB: User data is only stored in memory, not saved to disk.');
    }
  });
}

//...
launch();
