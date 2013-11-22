var fs = require('fs'),
  http = require('http'),
  https = require('https'),
  static = require('node-static');
    
var dontPersist = true;

if(! fs.existsSync) {
  fs.existsSync = function(path) {
    try {
      fs.statSync(path);
      return true;
    } catch(e) {
      return false;
    }
  };
}

var amd = false;
if(typeof(exports) === 'undefined') {
  var exports = {};
  amd = true;
}


function staticServer(path) {
  var file = new static.Server(path);
  return function (req, res) {
    req.addListener('end', function () {
      file.serve(req, res);
    }).resume();
  };
}

if((!amd) && (require.main==module)) {//if this file is directly called from the CLI
  fs.readdir('./apps/', function(err, listing) {
    if(err) {
      console.log('make sure ./apps/ exists');
    } else {
      var config = {
        initialTokens: {
          'my_secret_bearer_token': [':rw']
        },
        defaultUserName: 'me',
        protocol: 'https',
        host: 'localhost',
        ssl: {
          cert: './tls.cert',
          key: './tls.key'
        },
        port: 443,
        firstAppPort: 4431,
        apps: {}
     };

     var ssl = {};
     for(var k in config.ssl){
       ssl[k] = fs.readFileSync(config.ssl[k])
     }

     for(var i=0; i<listing.length; i++) {
        console.log('setting listener');
        var listener = staticServer('./apps/'+listing[i]);
        console.log('starting server');
        https.createServer(ssl, listener).listen(config.firstAppPort+i);
        config.apps['https://localhost:'+(config.firstAppPort+i)+'/'] = listing[i];
      }
      var server = require('./remotestorage-server').server(config);
      dontPersist = process.argv.length > 1 && (process.argv.slice(-1)[0] == ('--no-persistence'));
      server.init();
      var webserver;
      if(config.protocol == 'https') {
        webserver = https.createServer(ssl, server.serve);
      } else {
        webserver = http.createServer(server.serve);
      }
      webserver.listen(config.port, function(){
        console.log('Example server started on '+ config.protocol + '://' + config.host +':' + config.port + '/');
      });
    }
  });
}

if(amd) {
  define([], exports);
}
