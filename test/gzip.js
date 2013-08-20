var assert = require("assert"),
	Stream = require("stream"),
	util = require("util"),
	argo = require("argo"),
	argo_gzip = require("../");

//Mocks

function Request(){
	this.headers = {};
	Stream.call(this);
}
util.inherits(Request, Stream);

function Response() {
  this.headers = {};
  this.statusCode = 0;
  this.body = '';
  this.writable = true;
  Stream.call(this);
}
util.inherits(Response, Stream);

function _getEnv() {
  return { 
    request: new Request(),
    response: new Response(),
    target: {},
    argo: {}
  };
}

describe("argo-gzip", function(){
	it("has a name and install property", function(){
		var server = argo();
		var gzip_package = argo_gzip(server);
		assert.ok(gzip_package.name === "gzip compression");
		assert.ok(gzip_package.install);
	});
});