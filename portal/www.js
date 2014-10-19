/**
 * File: www
 *
 * Maintainer: Michiel de Jong <michiel@unhosted.org>
 * Version: -    0.1.0
 *
 */
RemoteStorage.defineModule('www', function(privClient, pubClient) {
  var authoringPorts = [];
  return {
    exports: {
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
      }
    }
  };
});
