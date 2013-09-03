var zlib = require('zlib'),
    argo = require('argo');

var zipPackage = module.exports = function(argo) {
  return {
    name:"gzip compression",
    install: function() {

      argo
      .use(function(handle){
        handle("request", function(env, next){
          var req = env.request;

          if(req._argoModified) {
            req._gzipModified = "request";
            req._deflatedResponse = false;
            var getRequestBodyFunc = req.getBody;
            req.getBody = function(cb) {      
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
                        req._deflatedResponse = true;
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
          next(env);

        });
        handle("response", {affinity:"hoist"}, function(env, next){
          var res;
          if(env.target.response) {
            res = env.target.response;
          } else {
            res = env.response;
          }

          if(res._argoModified) {
            res._gzipModified = "response";
            res._deflatedResponse = false;
            var getRequestBodyFunc = res.getBody;
            res.getBody = function(cb) {      
              getRequestBodyFunc.call(res, function(error, body){
                if(!body) {
                    cb(null, body)
                }

                if("content-encoding" in res.headers) {
                  var encoding;
                  encoding = res.headers["content-encoding"]
                  if (encoding.indexOf('gzip') !== -1) {
                    if(res._deflatedResponse) {
                      cb(null, body);
                    } else {
                      zlib.gunzip(body, function(error, result){
                        if(error) {
                          cb(error);
                        } else {
                          res._deflatedResponse = true;
                          cb(null, result);
                        }
                      });
                    }
                  } else {
                    cb(null, body);
                  }
                } else {
                  cb(null, body);
                }
              });
            }
          }
          next(env);
        });
      })
      .use(function(handle){ 
        handle("response", {affinity:"sink"}, function(env, next){
          var r;
          if(env.target.response) {
            r = env.target.response;
          } else {
            r = env.response;
          }
          var acceptEncoding = env.request.headers["accept-encoding"];
          if(acceptEncoding && acceptEncoding.indexOf("gzip") !== -1) {
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
    }
  }
}
