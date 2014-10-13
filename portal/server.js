var file = new (require('node-static')).Server('.');
require('http').createServer(function (req, res) {
  req.addListener('end', function () {
    file.serve(req, res);
  }).resume();
}).listen(4242);