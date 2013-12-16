RemoteStorage.defineModule('notes', function(privateClient, publicClient) {
  privateClient.cache('');
  return {
    exports: {
      setNote: function (text) {
        return privateClient.storeFile('text/plain', 'note.txt', text);
      },
      setThing: function (name, text) {
        return privateClient.storeFile('text/plain', 'things/a'+name, text);
      },
      getThing: function (name) {
        return privateClient.getFile('things/a'+name).then(function(obj) {
          return obj.data;
        });
      },
      getNote: function () {
        return privateClient.getFile('note.txt').then(function(obj) {
          return obj.data;
        });
      },
      onChange: function (cb) {
        privateClient.on('change', cb);
      }
    }
  };
});
