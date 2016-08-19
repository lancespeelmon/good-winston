/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
const stream        = require('stream')
const util          = require('util')
const Hoek          = require('hoek');
const SafeStringify = require('json-stringify-safe');

const internals = {
  defaults: {
    error_level: 'error',
    ops_level: 'info',
    request_level: 'info',
    response_level: 'info',
    other_level: 'info',
    color: true
  }
};

class GoodWinston  extends stream.Transform {

  constructor(winston, options) {
    super({objectMode: true});
    options = options || {};    
    Hoek.assert(this.constructor === GoodWinston, 'GoodWinston must be created with new');
    Hoek.assert(winston, 'winston logger must not be null');

    let settings        = Object.assign({}, internals.defaults, options);
    this.winston        = winston;
    this.error_level    = settings.error_level;
    this.ops_level      = settings.ops_level;
    this.request_level  = settings.request_level;
    this.response_level = settings.response_level;
    this.other_level    = settings.other_level;
  }

  _logResponse(event, tags) {
    var query, responsePayload;
    tags  = tags || []
    query = event.query ? JSON.stringify(event.query) : '';
    responsePayload = '';
    if (typeof event.responsePayload === 'object' && event.responsePayload) {
      responsePayload = 'response payload: ' + SafeStringify(event.responsePayload);
    }
    return this.winston[this.response_level](("[" + tags + "], ") + Hoek.format('%s: %s %s %s %s (%sms) %s', event.instance, event.method, event.path, query, event.statusCode, event.responseTime, responsePayload));
  }

  _transform(event, data) {
    if (event === 'response') {
      return this._logResponse(data, data.tags);
    } else if (event === 'ops') {
      return this.winston[this.ops_level](Hoek.format('memory: %sMb, uptime (seconds): %s, load: %s', Math.round(data.proc.mem.rss / (1024 * 1024)), data.proc.uptime, data.os.load));
    } else if (event === 'error') {
      return this.winston[this.error_level]('message: ' + data.error.message + ' stack: ' + data.error.stack);
    } else if (event === 'request' || event === 'log') {
      return this.winston[this.request_level]('data: ' + (typeof data.data === 'object' ? SafeStringify(data.data) : data.data));
    } else if (data.data) {
      return this.winston[this.other_level]('data: ' + (typeof data.data === 'object' ? SafeStringify(data.data) : data.data));
    } else {
      return this.winston[this.other_level]('data: (none)');
    }
  }
}
module.exports = GoodWinston;
