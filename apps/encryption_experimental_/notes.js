RemoteStorage.defineModule('notes', function(privateClient, publicClient) {
  privateClient.declareType('config', {
    type: 'object',
    properties: {
      text: { type: 'string' }
      },
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
    for (var i=0; i<changeHandlers.length; i++) {
      changeHandlers[i](e);
    }
  });
  var credentialsStore = new CredentialsStore('notes', privateClient), changeHandlers = [];
  return {
    exports: {
      getNote: function() {
        return credentialsStore.getConfig(remoteStorage.widget.view.userSecretKey).then(function(obj) {
          return obj.text;
        }, function(err) {
          return '';
        });
      },
      setNote: function(text) {
        return credentialsStore.setConfig(remoteStorage.widget.view.userSecretKey, {
          text: text
        });
      },
      onChange: function(handler) {
        changeHandlers.push(handler);
      }
    }
  };
});