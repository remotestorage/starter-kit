RemoteStorage.defineModule('money', function(privateClient, publicClient) {
  privateClient.cache('');
  return {
    exports: {
      setIOUs: function (tabName, IOUs) {
        console.log('storing', IOUs);
        return privateClient.storeObject('IOUlist', tabName, IOUs);
      },
      getIOUs: function (tabName) {
        console.log('retrieving');
        return privateClient.getObject(tabName);
      },
      onChange: function (cb) {
        privateClient.on('change', cb);
      }
    }
  };
});