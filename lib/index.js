/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
const Moment        = require('moment');
const Hoek          = require('hoek');
const stream        = require('stream');
const SafeStringify = require('json-stringify-safe');

const internals = {
    defaults: {
        format: 'YYMMDD/HHmmss.SSS',
        utc: true,
        color: true,
        level: {
            other: 'info',
            error: 'error',
            ops: 'info',
            //if unset log level will be parsed from the first tag as any other App level log
            request: undefined,
            response: 'info'
        }
    }
};

internals.utility = {
    formatOutput(event, settings) {

        let timestamp = Moment(parseInt(event.timestamp, 10));

        if (settings.utc) {
            timestamp = timestamp.utc();
        }

        timestamp = timestamp.format(settings.format);

        event.tags = event.tags.toString();
        const tags = ` [${event.tags}] `;

        // add event id information if available, typically for 'request' events
        const id = event.id ? ` (${event.id})` : '';

        const output = `${timestamp},${id}${tags}${event.data}`;

        return output + `\n`;
    },

    formatMethod(method, settings) {

        const methodColors = {
            get: 32,
            delete: 31,
            put: 36,
            post: 33
        };

        let formattedMethod = method.toLowerCase();
        if (settings.color) {
            const color = methodColors[method.toLowerCase()] || 34;
            formattedMethod = `\x1b[1;${color}m${formattedMethod}\x1b[0m`;
        }

        return formattedMethod;
    },

    formatStatusCode(statusCode, settings) {

        let color;
        if (statusCode && settings.color) {
            color = 32;
            if (statusCode >= 500) {
                color = 31;
            }
            else if (statusCode >= 400) {
                color = 33;
            }
            else if (statusCode >= 300) {
                color = 36;
            }

            return `\x1b[${color}m${statusCode}\x1b[0m`;
        }

        return statusCode;
    },

    formatResponse(event, tags, settings) {

        const query = event.query ? JSON.stringify(event.query) : '';
        const method = internals.utility.formatMethod(event.method, settings);
        const statusCode = internals.utility.formatStatusCode(event.statusCode, settings) || '';

        // event, timestamp, id, instance, labels, method, path, query, responseTime,
        // statusCode, pid, httpVersion, source, remoteAddress, userAgent, referer, log
        // method, pid, error
        const output = `${event.instance}: ${method} ${event.path} ${query} ${statusCode} (${event.responseTime}ms)`;

        const response = {
            timestamp: event.timestamp,
            tags,
            data: output
        };

        return internals.utility.formatOutput(response, settings);
    },

    formatOps(event, tags, settings) {

        const memory = Math.round(event.proc.mem.rss / (1024 * 1024));
        const output = `memory: ${memory}Mb, uptime (seconds): ${event.proc.uptime}, load: [${event.os.load}]`;

        const ops = {
            timestamp: event.timestamp,
            tags,
            data: output
        };

        return internals.utility.formatOutput(ops, settings);
    },

    formatError(event, tags, settings) {

        const output = `message: ${event.error.message}, stack: ${event.error.stack}`;

        const error = {
            timestamp: event.timestamp,
            tags,
            data: output
        };

        return internals.utility.formatOutput(error, settings);
    },

    formatDefault(event, tags, settings) {

        const data = typeof event.data === 'object' ? SafeStringify(event.data) : event.data;
        const output = `data: ${data}`;

        const defaults = {
            timestamp: event.timestamp,
            id: event.id,
            tags,
            data: output
        };

        return internals.utility.formatOutput(defaults, settings);
    },

    // finds the first tag that represent a log level or return other level
    levelFromTags(tags, settings, levels) {
        return tags.reduce((level, tag) =>  level || levels[tag] !== undefined && tag, false) || settings.level.other;
    }
};

class GoodWinston  extends stream.Writable {
    constructor(config) {
        super({objectMode: true});
        Hoek.assert(this.constructor === GoodWinston, 'GoodWinston must be created with new');
        Hoek.assert(config && config.winston, 'winston logger must not be null');

        this._settings = Hoek.applyToDefaults(internals.defaults, config);
        this.winston   = config.winston;

        Object.keys(this._settings.level).forEach(level => {
            this._settings.level[level] && Hoek.assert(this.winston.levels[this._settings.level[level]] !== undefined, `Log level ${this._settings.level[level]}(${level}) is not defined in winston`);
        });
    }

    _write(data, encoding, callback) {
        const eventName = data.event;
        let formatter = internals.utility.formatDefault;
        let tags = [];
        let level;

        if (Array.isArray(data.tags)) {
            tags = data.tags.concat([]);
        }
        else if (data.tags) {
            tags = [data.tags];
        }

        switch (eventName) {
            case 'error':
                formatter = internals.utility.formatError;
                level = this._settings.level.error;
                break;
            case 'ops':
                formatter = internals.utility.formatOps;
                level = this._settings.level.ops;
                break;
            case 'response':
                formatter = internals.utility.formatResponse;
                level = this._settings.level.response;
                break;
            case 'request':
                level = this._settings.level.request || internals.utility.levelFromTags(tags, this._settings, this.winston.levels);
                break;
        }

        if (!level) {
             if (data.data instanceof Error) {
                data.error = data.data;
                formatter = internals.utility.formatError;
                level = this._settings.level.error;
            } else {
                if (!data.data) {
                    data.data = '(none)';
                }

                level = internals.utility.levelFromTags(tags, this._settings, this.winston.levels);
            }
        }

        tags.unshift(eventName);
        this.winston.log(level, formatter(data, tags, this._settings));
        setImmediate(callback);
    }
}

module.exports = GoodWinston;
