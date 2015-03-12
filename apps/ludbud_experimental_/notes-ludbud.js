window.notes = {
  //properties: _ludbud, _note, _etag, _cb
  setNote: function (text) {
    this._ludbud.update('/notes/note.txt', text, 'text/plain; charset=utf-8', this._etag || undefined, function(err, newETag) {
      if (err) {
        console.log('Looks like we might have a conflict, let\'s check');
        this._sync();
      } else {
        console.log('Uploaded note as', text, err, newETag);
        this._newVersion(newETag, text);
      }
    }.bind(this));
  },
  getNote: function () {
    return this._note;
  },
  onChange: function (setCb) {
    this._cb = setCb;
  },
  startSync: function (userDataCredentials) {
    this._ludbud = new Ludbud(userDataCredentials);
    this._sync();
    setInterval(function() {
      notes._sync();
    }, 10000);
  },
  _newVersion: function(etag, body) {
    this._etag = etag;
    this._note = body;
    if (typeof this._cb === 'function') {
      this._cb();
    }
  },
  _sync: function () {
    this._ludbud.getDocument('/notes/note.txt', function(err, data) {
      console.log('fetched', err, data);
      if (err === Ludbud.ERR_ACCESS_DENIED) {
        console.log('Please reconnect!');
      } else if (err === Ludbud.ERR_TIMEOUT) {
        console.log('Timeout! Is your remoteStorage server running and reachable?');
      } else if (err === Ludbud.ERR_SERVER_ERROR) {
        console.log('Server reported a server error!');
      } else if (err === Ludbud.ERR_NOT_FOUND) {
        this._newVersion(undefined, undefined);
      } else if (data.info.ETag !== this._etag) {
        console.log('Read body (ArrayBuffer)', err, data);
        //see if we can interpret that as utf-8:
        try {
          var fileReader = new FileReader();
          fileReader.addEventListener('loadend', function (evt) {
            console.log('Read body (as utf-8)', evt.target.result);
            this._newVersion(data.info.ETag, evt.target.result);
          }.bind(this));
          fileReader.readAsText(new Blob([data.body], { type: 'text/plain;charset=utf-8'}));
        } catch(e) {
          console.log('Could not read ArrayBuffer as utf-8', e);
        }
      }
    }.bind(this));
  }
};
