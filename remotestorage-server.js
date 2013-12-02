var fs = require('fs'),
  url = require('url'),
  crypto = require('crypto');

exports.createServer = function(kv) {
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

  return storage;
};