var zlib = require('zlib'),
    argo = require('argo');

var zipPackage = module.exports = function(argo) {
  return {
    name:"gzip compression",
    install: function() {
      argo.use(function(handle){
        handle("response", {affinity:"sink"}, function(env, next){
          var r;
          if(env.target.response) {
            r = env.target.response;
          } else {
            r = env.response;
          }
          
          if(env.request.headers["accept-encoding"].indexOf("gzip") !== -1) {
            if (r._deflatedResponse) {
              r.getBody(function(error, body){

                if(error) {
                  console.log(error);
                  r.statusCode = 500;
                  r.body = error;
                  next(env);
                } else {
                  var zip = zlib.createGzip();

                  zlib.gzip(body, function(error, zippedBuffer){
                    if(error) {
                      r.statusCode = 500;
                      r.body = error;
                      next(env);
                    } else {
                      env.response.body = zippedBuffer.toString();
                      next(env);
                    }
                  }); 
                }
              });
            } else {
              next(env);
            }
          } else {
            next(env);
          }
          
        });
      });

      var serverResponseProto = argo._http.ServerResponse.prototype;
      var serverRequestProto = argo._http.IncomingMessage.prototype;
      if(serverRequestProto._argoModified) {
        serverRequestProto._gzipModified = "request";
        serverResponseProto._deflatedResponse = false;
        var getRequestBodyFunc = serverRequestProto.getBody;
        serverRequestProto.getBody = function(cb) {      
          var self = this;
          
          getRequestBodyFunc.call(this, function(error, body){
            if(!body) {
                cb(null, body)
            }

            if("content-encoding" in self.headers) {
              var encoding;
              encoding = self.headers["content-encoding"]
              
              if (encoding.indexOf('gzip') !== -1) {
                zlib.gunzip(body, function(error, result){
                  if(error) {
                    cb(error);
                  } else {
                    serverRequestProto._deflatedResponse = true;
                    cb(null, result);
                  }
                });
              } else {
                cb(null, body);
              }
            } else {
              cb(null, body);
            }
          });
        }
      }

      if(serverResponseProto._argoModified) {
        serverResponseProto._gzipModified = "response";
      }
      
    }
  }
}
