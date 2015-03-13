GoodReporter = require 'good-reporter'
Hoek = require 'hoek'

internals =
  defaults:
    level: 'info'

class GoodWinston
  constructor: (events, winston, options = {}) ->
    console.log "events=", events
    console.log "winston=", winston?
    Hoek.assert @constructor == GoodWinston, 'GoodWinston must be created with new'
    Hoek.assert winston, 'winston logger must not be null'
    settings = Hoek.applyToDefaults internals.defaults, options
    console.log "settings=", settings
    @winston = winston
    @level = settings.level
    GoodReporter.call this, events, settings

Hoek.inherits GoodWinston, GoodReporter

GoodWinston::_report = (event, eventData) ->
  console.log "_report()"
  console.dir event
  if event == 'ops'
    @winston[@level] Hoek.format 'memory: %sMb, uptime (seconds): %s, load: %s',
      Math.round(eventData.proc.mem.rss / (1024 * 1024)),
      eventData.proc.uptime,
      eventData.os.load

GoodWinston::start = (emitter, callback) ->
  emitter.on 'report', @_handleEvent.bind(this)
  callback null

GoodWinston::stop = ->
  return

module.exports = GoodWinston
