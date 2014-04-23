var fs = require('fs'),
  url = require('url'),
  crypto = require('crypto'),
  RemotestorageServer = require('remotestorage-server');

exports.createInstance = function(kv, config) {
  var tokenStore = {
    get: function(username, token, cb) { return kv.get(username+':token:'+token, cb); },
    set: function(username, token, obj, cb) { return kv.set(username+':token:'+token, obj, cb); }
  };
  var dataStore = {
    get: function(username, key, cb) { return kv.get(username+':data:'+key, cb); },
    set: function(username, key, buf, cb) { return kv.set(username+':data:'+key, buf, cb); }
  };

  var rootScope,
    specVersion = 'draft-dejong-remotestorage-01',
    remotestorageServer = new RemotestorageServer(specVersion, tokenStore, dataStore);

  if (specVersion === 'draft-dejong-remotestorage-00' || specVersion === 'draft-dejong-remotestorage-01') {
    rootScope = 'root';
  } else {//02, 03, etc.
    rootScope = '*';
  }

  function log() {
    console.log.apply(console, arguments);
  }
  
  function createToken(userName, scopes, cb) {
    crypto.randomBytes(48, function(ex, buf) {
      var token = buf.toString('hex');
      var scopePaths = remotestorageServer.makeScopePaths(scopes);
      log('createToken ',userName,scopes);
      log('adding ',scopePaths,' for',token);
      tokenStore.set(userName, token, scopePaths, function(err) {
        cb(token);
      });
    });
  }
  function writeHead(res, status, origin, timestamp, contentType, contentLength) {
    console.log('writeHead', status, origin, timestamp, contentType, contentLength);
    var headers = {
      'Access-Control-Allow-Origin': (origin?origin:'*'),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE',
      'Expires': '0'
    };
    if(typeof(timestamp) != 'undefined') {
      headers['etag']= '"'+timestamp.toString()+'"';
    }
    if(contentType) {
      headers['content-type']= contentType;
    }
    if(contentLength) {
      headers['content-length']= contentLength;
    }
    res.writeHead(status, headers);
  }

  function writeRaw(res, contentType, content, origin, timestamp) {
    writeHead(res, 200, origin, timestamp, contentType, content.length);
    res.write(content);
    res.end();
  }

  function writeJson(res, obj, origin, timestamp) {
    writeRaw(res, 'application/json', JSON.stringify(obj), origin, timestamp);
  }
  function writeHtml(res, html) {
    res.writeHead(200, {
      'content-type': 'text/html'
    });
    res.write('<!DOCTYPE html lang="en"><head><title>'+config.host+'</title><meta charset="utf-8"></head><body>'+html+'</body></html>');
    res.end();
  }
  function give404(res, origin) {
    log('404');
    writeHead(res, 404, origin);
    res.end();
  }
  function computerSaysNo(res, origin, status, timestamp) {
    log('COMPUTER_SAYS_NO - '+status);
    writeHead(res, status, origin, timestamp);
    res.end();
  }
  function toHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function portal(req, res) {
    var urlObj = url.parse(req.url, true);
    res.writeHead(200, {
      'content-type': 'text/html'
    });
    res.write('<!DOCTYPE html lang="en"><head><title>'+config.host+'</title><meta charset="utf-8"></head><body><ul>');
    var outstanding = 0;
    for(var i in config.apps) {
      outstanding++;
      (function(i) {
        createToken(config.defaultUserName, [rootScope+':rw'], function(token) {
          res.write('<li><a href="'+i+'#remotestorage=me@'+config.host+':'+config.portalPort
                    +'&access_token='+token+'">'+config.apps[i]+'</a></li>');
          outstanding--;
          if(outstanding==0) {
            res.write('</ul></body></html>');
            res.end();
          }
        });
      })(i);
    }
  }
  function webfinger(req, res) {
    var urlObj = url.parse(req.url, true);
    log('WEBFINGER');
    if(urlObj.query['resource']) {
      userAddress = urlObj.query['resource'].substring('acct:'.length);
      userName = userAddress.split('@')[0];
    }
    writeJson(res, {
      links:[ remotestorageServer.getWebfingerLink('http', config.host, config.storagePort, userName, 'http://'+config.host+':'+config.portalPort+'/auth/'+userName) ]
    });
  }
  function oauth(req, res) {
    var urlObj = url.parse(req.url, true);
    var scopes = decodeURIComponent(urlObj.query['scope']).split(' '),
    clientId = decodeURIComponent(urlObj.query['client_id']),
    redirectUri = decodeURIComponent(urlObj.query['redirect_uri']),
    state = (urlObj.query['state'] ? decodeURIComponent(urlObj.query['state']) : undefined),
    clientIdToMatch,
    userName;
    var userName = urlObj.pathname.substring('/auth/'.length);
    createToken(userName, scopes, function(token) {
      writeHtml(res, '<a href="'+toHtml(redirectUri)
          + '#access_token='+toHtml(token)
          + (state === undefined ? '' : '&state='+toHtml(state))
          + '">Allow</a>');
    });
  }

  return {
    portal: portal,
    webfinger: webfinger,
    oauth: oauth,
    storage: function(req, res) {
      return remotestorageServer.storage(req, res);
    }
  };
};
