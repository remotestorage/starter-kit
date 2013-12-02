var fs = require('fs'),
  url = require('url'),
  crypto = require('crypto');

exports.createInstance = function(kv, config) {
  function makeScopePaths(userName, scopes) {
    var scopePaths=[];
    for(var i=0; i<scopes.length; i++) {
      var thisScopeParts = scopes[i].split(':');
      if(thisScopeParts[0]=='') {
        scopePaths.push(userName+'/:'+thisScopeParts[1]);
      } else {
        scopePaths.push(userName+'/'+thisScopeParts[0]+'/:'+thisScopeParts[1]);
        scopePaths.push(userName+'/public/'+thisScopeParts[0]+'/:'+thisScopeParts[1]);
      }
    }
    return scopePaths;
  }

  function log(str) {
    console.log(str);
  }
  
  function addToken(token, scopes) {
    kv.set('tokens:'+token, makeScopePaths('me', scopes));
  }

  function createInitialTokens() {
    if(! config.initialTokens) {
      return;
    }
    for(var token in config.initialTokens) {
      var scopePaths = makeScopePaths(
        config.defaultUserName, config.initialTokens[token]
      );
      log('adding ',scopePaths,' for', token);
      kv.set('token:'+token, scopePaths);
    }
  }

  function createToken(userName, scopes, cb) {
    crypto.randomBytes(48, function(ex, buf) {
      var token = buf.toString('hex');
      var scopePaths = makeScopePaths(userName, scopes);
      log('createToken ',userName,scopes);
      log('adding ',scopePaths,' for',token);
      kv.set('tokens:'+token, scopePaths);
      cb(token);
    });
  }
  function mayRead(authorizationHeader, path) {
    if(authorizationHeader) {
      var scopes = kv.get('tokens:'+authorizationHeader.substring('Bearer '.length));
      if(scopes) {
        for(var i=0; i<scopes.length; i++) {
          var scopeParts = scopes[i].split(':');
          if(path.substring(0, scopeParts[0].length)==scopeParts[0]) {
            return true;
          } else {
            log(path.substring(0, scopeParts[0].length)+' != '+ scopeParts[0]);
          }
        }
      }
    } else {
      var pathParts = path.split('/');
      console.log('pathParts are', pathParts);
      return (pathParts[0]=='me' && pathParts[1]=='public' && path.substr(-1) != '/');
    }
  }
  function mayWrite(authorizationHeader, path) { 
    if(path.substr(-1)=='/') {
      return false;
    }
    if(authorizationHeader) {
      var scopes = kv.get('tokens:'+authorizationHeader.substring('Bearer '.length));
      if(scopes) {
        for(var i=0; i<scopes.length; i++) {
          var scopeParts = scopes[i].split(':');
          if(scopeParts.length==2 && scopeParts[1]=='rw' && path.substring(0, scopeParts[0].length)==scopeParts[0]) {
            return true;
          }
        }
      }
    }
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
        createToken(config.defaultUserName, [':rw'], function(token) {
          res.write('<li><a href="'+i+'#remotestorage=me@localhost'
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
      links:[{
        href: 'http://'+config.host+':'+config.port+'/storage/'+userName,
        rel: "remotestorage",
        properties: {
          'http://remotestorage.io/spec/version': 'draft-dejong-remotestorage-02',
          'http://tools.ietf.org/html/rfc6749#section-4.2': 'http://'+config.host+':'+config.port+'/auth/'+userName,
          'http://tools.ietf.org/html/rfc6750#section-2.3': false,
          'http://tools.ietf.org/html/rfc2616#section-14.16': false
        }
      }]
    });
  }
  function oauth(req, res) {
    var urlObj = url.parse(req.url, true);
    var scopes = decodeURIComponent(urlObj.query['scope']).split(' '),
    clientId = decodeURIComponent(urlObj.query['client_id']),
    redirectUri = decodeURIComponent(urlObj.query['redirect_uri']),
    clientIdToMatch,
    userName;
    var userName = urlObj.pathname.substring('/auth/'.length);
    createToken(userName, scopes, function(token) {
      writeHtml(res, '<a href="'+toHtml(redirectUri)+'#access_token='+toHtml(token)+'">Allow</a>');
    });
  }
  function getVersion(path) {
    if(kv.get('version:'+path)) {
      return kv.get('version:'+path);
    }
    if(path.substr(-1)=='/') {
      return 'empty-dir';
    }
  }
  function condMet(cond, path) {
    if(cond.ifNoneMatch=='*') {//if-none-match is either '*'...
      if(kv.get('content:'+path)) {
        return false;
      }
    } else if(cond.ifNoneMatch && getVersion(path)) {//or a comma-separated list of etags
      if(cond.ifNoneMatch.split(',').indexOf(String('"'+getVersion(path)+'"'))!=-1) {
        return false;
      }
    }
    if(cond.ifMatch) {//if-match is always exactly 1 etag
      if(kv.get('version:'+path) != cond.ifMatch) {
        return false;
      }
    }
    return true;
  }
  function toJsonLd(revisions) {
    var items = {};
    for(var i in revisions) {
      items[i] = { ETag: revisions[i] };
    }
    return {
      '@context': 'http://remotestorage.io/spec/folder-description',
      items: items
    };
  }
      
  function storage(req, res) {
    var urlObj =  url.parse(req.url, true);
    var path=urlObj.pathname.substring('/storage/'.length);
    var cond = {
      ifNoneMatch: req.headers['if-none-match'],
      ifMatch: req.headers['if-match']
    };
    var capt = {
      method: req.method,
      path: path
    };

    if(req.method=='OPTIONS') {
      log('OPTIONS ', req.headers);
      writeJson(res, null, req.headers.origin);
    } else if(req.method=='HEAD') {
      log('HEAD');
      if(!mayRead(req.headers.authorization, path)) {
        computerSaysNo(res, req.headers.origin, 401);
      } else if(!condMet(cond, path)) {
        computerSaysNo(res, req.headers.origin, 304, kv.get('version:'+path));
      } else {
        if(kv.get('content:'+path)) {
          if(path.substr(-1)=='/') {
            writeJson(res, '', req.headers.origin, kv.get('version:'+path), cond);
          } else {
            writeRaw(res, kv.get('contentType:'+path), '', req.headers.origin, kv.get('version:'+path), cond);
          }
        } else {
          if(path.substr(-1) == '/' && path.split('/').length == 2) {
            writeJson(res, '', req.headers.origin, getVersion(path), cond);
          } else {
            give404(res, req.headers.origin);
          }
        }
      }
    } else if(req.method=='GET') {
      log('GET');
      if(!mayRead(req.headers.authorization, path)) {
        computerSaysNo(res, req.headers.origin, 401);
      } else if(!condMet(cond, path)) {
        computerSaysNo(res, req.headers.origin, 304, kv.get('version:'+path));
      } else {
        if(kv.get('content:'+path)) {
          if(path.substr(-1)=='/') {
            writeJson(res, toJsonLd(kv.get('content:'+path)), req.headers.origin, kv.get('version:'+path), cond);
          } else {
            writeRaw(res, kv.get('contentType:'+path), kv.get('content:'+path), req.headers.origin, kv.get('version:'+path), cond);
          }
        } else {
          if(path.substr(-1) == '/') {//empty dir
            writeJson(res, {}, req.headers.origin, getVersion(path), cond);
          } else {
            give404(res, req.headers.origin);
          }
        }
      }
    } else if(req.method=='PUT') {
      log('PUT');
      if(path.substr(-1)=='/') {
        computerSaysNo(res, req.headers.origin, 400);
      } else if(!mayWrite(req.headers.authorization, path)) {
        computerSaysNo(res, req.headers.origin, 401);
      } else if(!condMet(cond, path)) {
        computerSaysNo(res, req.headers.origin, 412, kv.get('version:'+path));
      } else {
        var dataStr = '';
        req.on('data', function(chunk) {
          dataStr+=chunk;
        });
        req.on('end', function() {
          var timestamp = new Date().getTime();
          kv.set('content:'+path, dataStr);
          kv.set('contentType:'+path, req.headers['content-type']);
          log('stored '+path, kv.get('content:'+path), kv.get('contentType:'+path));
          kv.set('version:'+path, timestamp);
          var pathParts=path.split('/');
          log(pathParts);
          var fileItself=true;
          while(pathParts.length > 1) {
            var thisPart = pathParts.pop();
            if(fileItself) {
              fileItself=false;
            } else {
              thisPart += '/';
            }
            var obj = kv.get('content:'+pathParts.join('/')+'/');
            if(!obj) {
              obj = {};
            }
            obj[thisPart] = timestamp;
            kv.set('content:'+pathParts.join('/')+'/', obj);
            kv.set('version:'+pathParts.join('/')+'/', timestamp);
          }
          writeJson(res, null, req.headers.origin, timestamp);
        });
      }
    } else if(req.method=='DELETE') {
      log('DELETE');
      if(path.substr(-1)=='/') {
        computerSaysNo(res, req.headers.origin, 400);
      } else if(!mayWrite(req.headers.authorization, path)) {
        computerSaysNo(res, req.headers.origin, 401);
      } else if(!condMet(cond, path)) {
        computerSaysNo(res, req.headers.origin, 412, kv.get('version:'+path));
      } else if(typeof(kv.get('content:'+path)) == 'undefined') {
        computerSaysNo(res, req.headers.origin, 404);
      } else {
        var timestamp = kv.get('version:'+path);
        kv.set('content:'+path, undefined);
        kv.set('contentType:'+path, undefined);
        kv.set('version:'+path, undefined);
        var pathParts=path.split('/');
        var thisPart = pathParts.pop();
        while(1) {
          var parentPath = pathParts.join('/') + '/';
          var parentListing = kv.get('content:'+parentPath);
          log('delete content[' + parentPath + ']['+thisPart+']');
          delete parentListing[thisPart];
          if(Object.keys(parentListing).length != 0 ||
             pathParts.length == 1) {
            kv.set('version:'+parentPath, new Date().getTime());
            break;
          } else {
            kv.set('content:'+parentPath, undefined);
            kv.set('version:'+parentPath, undefined);
            thisPart = pathParts.pop() + '/';
          }
        }
        writeJson(res, null, req.headers.origin, timestamp);
      }
    } else {
      log('ILLEGAL '+req.method);
      computerSaysNo(res, req.headers.origin, 405);
    }
  }

  return {
    portal: portal,
    webfinger: webfinger,
    oauth: oauth,
    storage: storage
  };
};