/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
const stream        = require('stream')
const util          = require('util')
const Hoek          = require('hoek');
const SafeStringify = require('json-stringify-safe');

const LOG      = 'log';
const REQUEST  = 'request';
const RESPONSE = 'response';
const ERROR    = 'error';
const OPS      = 'ops'


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
    let query, responsePayload;
    responsePayload = {};
    tags            = tags || []
    query           = event.query ? JSON.stringify(event.query) : '';

    if (util.isObject( event )) {
      responsePayload = `response payload: ${SafeStringify(event.responsePayload || {})}`;
    }
    return this.winston[this.response_level](`[${tags}] ${event.instance}: ${event.method} ${event.path} ${query} ${event.statusCode} (${event.responseTime}ms) ${responsePayload}`);
  }

  _transform(data, encoding, callback) {
    switch(data.event){
      case RESPONSE:
      this._logResponse(data, data.tags);
      break;
      case OPS:
      this.winston[this.ops_level](`memory: ${Math.round(data.proc.mem.rss / (1024 * 1024))}Mb, uptime (seconds): ${data.proc.uptime}, load: ${ data.os.load}`);
      break;
    case ERROR:
      this.winston[this.error_level](`message: ${data.error.message}\n stack: ${data.error.stack}`);
      break;
    case LOG:
    case REQUEST:
      this.winston[this.request_level]('data: ' + (typeof data.data === 'object' ? SafeStringify(data.data) : data.data));
      break;
    default:
      if( data.data ){
        this.winston[this.other_level]('data: ' + (typeof data.data === 'object' ? SafeStringify(data.data) : data.data));
      } else {
        this.winston[this.other_level]('data: (none)');
      }
    }
    setImmediate(()=>{
      callback( null, data );
    });
  }
}
module.exports = GoodWinston;
