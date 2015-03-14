GoodReporter = require 'good-reporter'
Hoek = require 'hoek'
SafeStringify = require 'json-stringify-safe'

internals =
  defaults:
    level: 'info'

class GoodWinston
  constructor: (events, winston, options = {}) ->
    Hoek.assert @constructor == GoodWinston, 'GoodWinston must be created with new'
    Hoek.assert winston, 'winston logger must not be null'
    settings = Hoek.applyToDefaults internals.defaults, options
    @winston = winston
    @level = settings.level
    GoodReporter.call this, events, settings

Hoek.inherits GoodWinston, GoodReporter

GoodWinston::_logResponse = (event, tags=[]) ->
  query = if event.query then JSON.stringify(event.query) else ''
  responsePayload = ''
  if typeof event.responsePayload == 'object' and event.responsePayload
    responsePayload = 'response payload: ' + SafeStringify event.responsePayload
  @winston[@level] "[#{tags}], " + Hoek.format '%s: %s %s %s %s (%sms) %s',
    event.instance,
    event.method,
    event.path,
    query,
    event.statusCode,
    event.responseTime,
    responsePayload

GoodWinston::_report = (event, data) ->
  if event == 'response'
    @_logResponse data, data.tags
  else if event == 'ops'
    @winston[@level] Hoek.format 'memory: %sMb, uptime (seconds): %s, load: %s',
      Math.round(data.proc.mem.rss / (1024 * 1024)),
      data.proc.uptime,
      data.os.load
  else if event == 'error'
    @winston[@level] 'message: ' + data.error.message + ' stack: ' + data.error.stack
  else if event == 'request' or event == 'log'
    @winston[@level] 'data: ' + if typeof data.data == 'object' then SafeStringify(data.data) else data.data
  # Event that is unknown to good-console, try a defualt.
  else if data.data
    @winston[@level] 'data: ' + if typeof data.data == 'object' then SafeStringify(data.data) else data.data
  else
    @winston[@level] 'data: (none)'

GoodWinston::start = (emitter, callback) ->
  emitter.on 'report', @_handleEvent.bind(this)
  callback null

GoodWinston::stop = ->
  return

module.exports = exports = GoodWinston
