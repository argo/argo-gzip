var zlib = require('zlib');

var gzip = module.exports = function(options) {
  return function(handle) {
    handle('response', function(env, next) {
      if(env.response.body instanceof String) {
        var buf = new Buffer(env.response.body)
        zlib.gzip(buf, function(_, result) {
          env.response.body = result;
          next(env);
        });
      }
    })
  };
}


