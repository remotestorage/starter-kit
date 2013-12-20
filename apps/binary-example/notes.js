RemoteStorage.defineModule('notes', function(privateClient, publicClient) {
  privateClient.cache('');
  return {
    exports: {
      setNote: function (text) {
        return privateClient.storeFile('text/plain', 'note.txt', text);
      },
      getNote: function () {
        return privateClient.getFile('note.txt').then(function(obj) {
          return obj.data;
        });
      },
      setImage: function (arrBuff, contentType) {
        return privateClient.storeFile(contentType, 'image.img', arrBuff);
      },
      getImage: function () {
        return privateClient.getFile('image.img');
      },
      onChange: function (cb) {
        privateClient.on('change', cb);
      }
    }
  };
});
