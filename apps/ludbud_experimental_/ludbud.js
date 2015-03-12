Ludbud = (function() {
  var ret = function(credentials){
    for(var i in credentials) {
      this[i] = credentials[i];
    }
  };

  ret.ERR_TIMEOUT = 'Ludbud.ERR_TIMEOUT';
  ret.ERR_ACCESS_DENIED = 'Ludbud.ERR_ACCESS_DENIED';
  ret.ERR_SERVER_ERROR = 'Ludbud.ERR_SERVER_ERROR';
  ret.ERR_NOT_FOUND = 'Ludbud.ERR_NOT_FOUND';
  ret.ERR_IS_FOLDER = 'Ludbud.ERR_IS_FOLDER';
  ret.ERR_NOT_A_FOLDER = 'Ludbud.ERR_NOT_A_FOLDER';

  function fail(str) {
    console.log('FAIL: '+str);
  }
function request(method, url, responseType, payload, headers, callback) {
  var xhr = new XMLHttpRequest(), calledBack = false;
  xhr.open(method, url);
  xhr.responseType = responseType;
  xhr.timeout = 10000;
  for (var i in headers) {
    xhr.setRequestHeader(i, headers[i]);
  }
  xhr.ontimeout = function(evt) {
    if (calledBack) {
      return;
    }
    callback(ret.ERR_TIMEOUT);
    calledBack = true;
  };
   
  xhr.onerror = function(evt) {
    if (calledBack) {
      return;
    }
    
    callback(ret.ERR_TIMEOUT);
    calledBack = true;
  };
   
  xhr.onabort = function(evt) {
    if (calledBack) {
      return;
    }
    callback(ret.ERR_TIMEOUT);
    calledBack = true;
  };
   
  xhr.onload = function() {
    if (calledBack) {
      return;
    }
    if (xhr.status >= 500) { // treat any 500+ response code as server error
      callback(ret.ERR_SERVER_ERROR);
    } else if (xhr.status === 404) { // special case for 404s
      callback(ret.ERR_NOT_FOUND);
    } else if (xhr.status >= 400) { // and rest of 400 range as access denied
      callback(ret.ERR_ACCESS_DENIED);
    } else { // now treat any response code under 400 as successful
      callback(null, {
        info: {
          'Content-Type': xhr.getResponseHeader('Content-Type'),
          'Content-Length': xhr.getResponseHeader('Content-Length'),
          ETag: xhr.getResponseHeader('ETag'),
          isFolder: url.substr(-1) === '/'
        },
        body: xhr.response
      });
    }
    calledBack = true;
  };
  xhr.send(payload);
}
//convenience methods that wrap around request:
function requestJSON(url, token, callback) {
  var headers = {};
  if (token) {
    headers.Authorization =  'Bearer '+token;
  }
  return request('GET', url, 'json', undefined, headers, function(err, data) {
    return callback(err, (typeof data === 'object' ? data.body : data));
  });
}
function requestArrayBuffer(method, url, token, payload, headers, callback) {
  if (token) {
    headers.Authorization =  'Bearer '+token;
  }
  return request(method, url, 'arraybuffer', payload, headers, callback);
}
ret.prototype.makeURL = function(dataPath, isFolder) {
  if (this.platform === 'owncloud') {
    if (isFolder) {
      return this.apiBaseURL
          + '/shares?path='
          + encodeURIComponent(dataPath)
    } else {
      return this.apiBaseURL
          + '/shares/'
          + encodeURIComponent(dataPath)
    }
  } else {
    return this.apiBaseURL + dataPath;
  }
};
ret.prototype.getClient = function(callback) {
  if (this.client) {
    cb(null, this.client);
  } else if (this.platform === 'hoodie') {
    this.client = new Hoodie('https://'+this.host);
    this.client.account.signIn(this.user, this.pass).done(function() {
      cb(null, this.client);
    }).fail(function(err) {
      cb(err);
    });
  } else {
    callback('don\'t know how to instantiate a client for platform '+this.platform);
  }
};
ret.prototype.getInfo = function(dataPath, callback) {
  if (this.platform === 'hoodie') {
    this.getClient(function(err, client) {
      if (err) {
        callback(err);
      } else {
        client.store('item', dataPath).done(function(data) {
          callback(null, data);
        }).fail(function(err) {
          callback(err);
        });
      }
    });
  } else {
    requestArrayBuffer('HEAD', this.makeURL(dataPath), this.token, undefined, {}, function(err, data) {
      if (err) {
        callback(err);
      } else {
        callback(err, data.info);
      }
    });
  }
};
ret.prototype.getDocument = function(dataPath, callback) {
  if (dataPath.substr(-1) === '/') {
    callback(ret.ERR_IS_FOLDER);
  } else {
    requestArrayBuffer('GET', this.makeURL(dataPath), this.token, undefined, {}, callback);
  }
};
ret.prototype.getFolder = function(dataPath, callback) {
  if (dataPath.substr(-1) === '/') {
    requestJSON(this.makeURL(dataPath), this.token, function(err, data) {
      if (err) {
        callback(err);
      } else {
        callback(err, data.items);
      }
    });
  } else {
    callback(ret.ERR_NOT_A_FOLDER);
  }
};
ret.prototype.create = function(dataPath, content, contentType, callback) {
  requestArrayBuffer('PUT', this.makeURL(dataPath), this.token, content, {
     'Content-Type': contentType,
     'If-None-Match': '"*"'
  }, function(err, data) {
    callback(err, (data && data.info ? data.info.ETag : undefined));
  });
};
ret.prototype.update = function(dataPath, content, contentType, existingETag, callback) {
  if (!existingETag) {
    return this.create(dataPath, content, contentType, callback);
  }
  requestArrayBuffer('PUT', this.makeURL(dataPath), this.token, content, {
     'Content-Type': contentType,
     'If-Match': existingETag
  }, function(err, data) {
    callback(err, (data && data.info ? data.info.ETag : undefined));
  });
};
ret.prototype.remove = function(dataPath, existingETag, callback) {
  requestArrayBuffer('DELETE', this.makeURL(dataPath), this.token, undefined, {
     'If-Match': existingETag
  }, callback);
};
var platformCredentials = {};
ret.setPlatformCredentials = function(platform, credentials) {
  platformCredentials[platform] = credentials;
}
ret.createCredentials = function(platform, host, user, pass) {
  fail('WARNING: platform ' + platform + ' not fully supported yet');
  var obj = {
    platform: platform
  };
  if (platform === 'owncloud') {
    obj.apiBaseURL = 'https://'
          + encodeURIComponent(user)
          + ':'
          + encodeURIComponent(pass)
          + '@'
          + host
          + '/ocs/v1.php/apps/files_sharing/api/v1';
  } else if (platform === 'hoodie') {
    if (!Hoodie) {
      fail('You need to add hoodie.js to your page for this to work, get it from https://hood.ie/');
    }
    obj.host = host;
    obj.user = user;
    obj.pass = pass;
  }
  return obj;
}

function getClientId(platform) {
  if (platform === 'remotestorage') {
    return window.location.origin;
  } else {
    return platformCredentials[platform];
  }
}
ret.oauth = function(platform, userAddress, scopes) {
  if (platform !== 'remotestorage') {
    fail('WARNING: platform ' + platform + ' not fully supported yet');
  }
  var apiBaseURL;
  function goTo(oauthBaseURL) {//this uses some variables from its parent scope
    var hashPos = document.location.href.indexOf('#'),
        hash = (hashPos === -1 ? '' : document.location.href.substring(hashPos));
    window.location = oauthBaseURL
        + '?redirect_uri=' + encodeURIComponent(document.location.href.replace(/#.*$/, ''))
        + '&scope=' + encodeURIComponent(scopes || '*:rw')
        + '&client_id=' + encodeURIComponent(getClientId(platform))
        + '&state=' + encodeURIComponent(JSON.stringify({
            platform: platform,
            hash: hash,
            apiBaseURL: apiBaseURL
          }))
        + '&response_type=token';
  }
  if (platform === 'dropbox') {
    goTo('https://www.dropbox.com/1/oauth2/authorize');
  } else if (platform === 'googledrive') {
    goTo('https://accounts.google.com/o/oauth2/auth');
  } else if (platform === 'remotestorage' || platform === 'remotestorage-no-https') {
    var parts = userAddress.split('@');
    var prefix = 'https://';
    if (platform === 'remotestorage-no-https') {
      prefix = 'http://';
    }
    requestJSON(prefix + parts[1] + '/.well-known/webfinger?resource='+encodeURIComponent('acct:'+userAddress),
        undefined, function(err, data) {
      if (err) {
        fail('error retrieving webfinger for '+userAddress, err);
      } else if (typeof data === 'object' && Array.isArray(data.links)) {
        for (var i=0; i< data.links.length; i++) {
          if (typeof data.links[i] === 'object'
              && data.links[i].rel === 'remotestorage'
              && typeof data.links[i].properties === 'object'
              && typeof data.links[i].properties['http://tools.ietf.org/html/rfc6749#section-4.2'] === 'string') {
            apiBaseURL = data.links[i].href;
            goTo(data.links[i].properties['http://tools.ietf.org/html/rfc6749#section-4.2']);
            return;
          }
        }
      } else {
        fail('error parsing webfinger for '+userAddress + JSON.stringify(data));
      }
    });
  } else {
    fail('unknown platform '+platform);
  }
}
var windowLocationToRestore;
ret.fromWindowLocation = function() {
  var hashPos = window.location.href.indexOf('#');
  if (hashPos === -1) {
    return;
  }
  var parsed = {},
      pairs = window.location.href.substring(hashPos+1).split('&');
  for(var i=0; i<pairs.length; i++) {
    var parts = pairs[i].split('=');
    parsed[parts[0]] = decodeURIComponent(parts[1]);
  }
  if (parsed['state']) {
    try {
      var stateObj = JSON.parse(parsed['state']);
      if (stateObj.hash) { // restore hash as it was:
        windowLocationToRestore = stateObj.hash;
      } else { // restore fact that there was no hash:
        windowLocationToRestore = window.location.href.substring(0, hashPos);
      }
      return {
        platform: stateObj.platform,
        token: parsed['access_token'],
        apiBaseURL: stateObj.apiBaseURL
      };
    } catch(e) {
    }
  }
}
ret.restoreWindowLocation = function() {
  window.location = windowLocationToRestore;
}
  return ret;
})();
