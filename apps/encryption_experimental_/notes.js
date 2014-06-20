RemoteStorage.defineModule('notes', function(privateClient, publicClient) {
  privateClient.declareType('note', {
    type: 'object',
    properties: {
      text: { type: 'string' }
      }
      required: ['text']
    });
  privateClient.on('change', function(e) {
    console.log('change coming from '+e.origin, JSON.stringify(e));
    if(e.relativePath=='note.txt') {
      note = e.newValue;
      if(cb) {
        cb(e);
      }
    }
  });
  var credentialsStore = new CredentialsStore('notes', privClient);
  return {
    exports: {
      getNote: function() {
        return credentialsStore.getConfig(remoteStorage.widget.view.userSecretKey);
      },
      setNote: function(text) {
        return credentialsStore.getConfig(remoteStorage.widget.view.userSecretKey, text);
      }
    }
  };
});