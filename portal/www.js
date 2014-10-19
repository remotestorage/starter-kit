/**
 * File: www
 *
 * Maintainer: Michiel de Jong <michiel@unhosted.org>
 * Version: -    0.1.0
 *
 */
RemoteStorage.defineModule('www', function(privClient, pubClient) {
  var MIN_WEB_AUTHORING_PORT = 1024;
  var MAX_WEB_AUTHORING_PORT = 65535;
  var authoringPorts = {};

  return {
    exports: {
      init: function() {
        pubClient.getListing('').then(function(listing) {
          console.log('existing apps', listing);
        });
        pubClient.on('change', function(evt) {
          var ports = evt.relativePath.split('/');
          console.log('change in app on port', ports[0]);
          authoringPorts[port] = true;
        });
      },
      authoringSupported: function() {
        return (remoteStorage && remoteStorage.remote
          && (typeof remoteStorage.remote.properties === 'object')
          && (typeof remoteStorage.remote.properties['http://remotestorage.io/spec/web-authoring'] === 'string'));
      },
      storeFile: function(authoringPort, contentType, path, body) {
        pubClient.storeFile(contentType, authoringPort+'/'+path, body);
      },
      getWebUrl: function(authoringPort, path) {
        return 'https://'
          + remoteStorage.remote.properties['http://remotestorage.io/spec/web-authoring']
          + ':' + authoringPort + '/' + path;
      },
      addAuthoringPort: function() {
        for (var i=MIN_WEB_AUTHORING_PORT; i<=MAX_WEB_AUTHORING_PORT; i++) {
          if (!authoringPorts[i.toString()]) {
            console.log('port stil free', i);
            return i;
          }
        }
        throw new Error('no web authoring ports left!');
      }
    }
  };
});
