"undefined"==typeof XMLHttpRequest&&(XMLHttpRequest=require("xmlhttprequest").XMLHttpRequest),function(a){function b(a){return a.toString=function(){return this.message},a}function c(a){"object"!=typeof a&&(a={}),this.config={tls_only:"undefined"!=typeof a.tls_only?a.tls_only:!0,webfist_fallback:"undefined"!=typeof a.webfist_fallback?a.webfist_fallback:!1,uri_fallback:"undefined"!=typeof a.uri_fallback?a.uri_fallback:!1,request_timeout:"undefined"!=typeof a.request_timeout?a.request_timeout:1e4}}var d={"http://webfist.org/spec/rel":"webfist","http://webfinger.net/rel/avatar":"avatar",remotestorage:"remotestorage",remoteStorage:"remotestorage","http://www.packetizer.com/rel/share":"share","http://webfinger.net/rel/profile-page":"profile",me:"profile",vcard:"vcard",blog:"blog","http://packetizer.com/rel/blog":"blog","http://schemas.google.com/g/2010#updates-from":"updates","https://camlistore.org/rel/server":"camilstore"},e={avatar:[],remotestorage:[],blog:[],vcard:[],updates:[],share:[],profile:[],webfist:[],camlistore:[]},f=["webfinger","host-meta","host-meta.json"];if(c.prototype._fetchJRD=function(a,c){var d=this,e=new XMLHttpRequest;e.onreadystatechange=function(){4===e.readyState&&(200===e.status?d._isValidJSON(e.responseText)?c(null,e.responseText):c(b({message:"invalid json",url:a,status:e.status})):c(404===e.status?b({message:"endpoint unreachable",url:a,status:e.status}):b({message:"error during request",url:a,status:e.status})))},e.open("GET",a,!0),e.setRequestHeader("Accept","application/jrd+json, application/json"),e.send()},c.prototype._isValidJSON=function(a){try{JSON.parse(a)}catch(b){return!1}return!0},c.prototype._isLocalhost=function(a){var b=/^localhost(\.localdomain)?(\:[0-9]+)?$/;return b.test(a)},c.prototype._processJRD=function(c,f){var g=JSON.parse(c);if("object"!=typeof g||"object"!=typeof g.links)return f(b("undefined"!=typeof g.error?{message:g.error}:{message:"unknown response from server"})),!1;var h=g.links,i={object:g,json:c,idx:{}};i.idx.properties={name:a},i.idx.links=JSON.parse(JSON.stringify(e)),h.map(function(a){if(d.hasOwnProperty(a.rel)&&i.idx.links[d[a.rel]]){var b={};Object.keys(a).map(function(c){b[c]=a[c]}),i.idx.links[d[a.rel]].push(b)}});var j=JSON.parse(c).properties;for(var k in j)j.hasOwnProperty(k)&&"http://packetizer.com/ns/name"===k&&(i.idx.properties.name=j[k]);f(null,i)},c.prototype.lookup=function(a,c){function d(){return l+"://"+j+"/.well-known/"+f[k]+"?resource=acct:"+a}function e(a){if(h.config.uri_fallback&&"webfist.org"!==j&&k!==f.length-1)k+=1,g();else if(h.config.tls_only||"https"!==l){if(!h.config.webfist_fallback||"webfist.org"===j)return c(a),!1;k=0,l="http",j="webfist.org",h._fetchJRD(d(),function(a,b){return a?(c(a),!1):void h._processJRD(b,function(a,b){"object"==typeof b.idx.links.webfist&&"string"==typeof b.idx.links.webfist[0].href&&h._fetchJRD(b.idx.links.webfist[0].href,function(a,b){a?c(a):h._processJRD(b,c)})})})}else k=0,l="http",g()}function g(){h._fetchJRD(d(),function(a,b){a?e(a):h._processJRD(b,c)})}if("string"!=typeof a)throw new Error("first parameter must be a user address");if("function"!=typeof c)throw new Error("second parameter must be a callback");var h=this,i=a.replace(/ /g,"").split("@"),j=i[1],k=0,l="https";return 2!==i.length?(c(b({message:"invalid user address "+a+" ( expected format: user@host.com )"})),!1):(h._isLocalhost(j)&&(l="http"),void setTimeout(g,0))},c.prototype.lookupLink=function(a,b,c){e.hasOwnProperty(b)?this.lookup(a,function(a,d){var e=d.idx.links[b];a?c(a):0===e.length?c('no links found with rel="'+b+'"'):c(null,e[0])}):c("unsupported rel "+b)},"object"==typeof window)window.WebFinger=c;else if("function"==typeof define&&define.amd)define([],function(){return c});else try{module.exports=c}catch(g){}}();
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
  if (platform !== 'remotestorage' && platform !== 'remotestorage-allow-insecure-webfinger') {
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
  } else if (platform === 'remotestorage' || platform === 'remotestorage-allow-insecure-webfinger') {

    var webfinger = new WebFinger({
      tls_only: (platform === 'remotestorage' ? true : false)
    });
    webfinger.lookupLink(userAddress, 'remotestorage', function (err, link) {
      if (err) {
        fail('error discovering remoteStorage location for '+userAddress, err);
      } else if (typeof link.href === 'string'
              && typeof link.properties === 'object'
              && typeof link.properties['http://tools.ietf.org/html/rfc6749#section-4.2'] === 'string') {
        apiBaseURL = link.href;
        goTo(link.properties['http://tools.ietf.org/html/rfc6749#section-4.2']);
      } else {
        fail('error parsing remoteStorage link for '+userAddress + JSON.stringify(link));
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
