RemoteStorage.defineModule('notes', function(privateClient, publicClient) {
  privateClient.cache('');
  var note, cb;
  privateClient.on('change', function(e) {
    console.log('change coming from '+e.origin, JSON.stringify(e));
    if(e.relativePath=='note.txt') {
      note = e.newValue;
      if(cb) {
        cb(e);
      }
    }
  });
  return {
    exports: {
      setNote: function (text) {
        privateClient.storeFile('text/plain', 'note.txt', text);
      },
      getNote: function () {
        return note;
      },
      onChange: function (setCb) {
        cb = setCb;
      }
    }
  };
});