# good-winston

A [hapi](http://hapijs.com) [good](https://github.com/hapijs/good) stream to [winston](https://github.com/winstonjs/winston) logging adapter.

This stream clones [good-console](https://github.com/hapijs/good-console) but terminates logs to winston.

## Installation

```bash
  $ npm install -S winston
  $ npm install -S good-winston
```

## Usage

To use the `GoodWinston` you simply need to require it and pass it a winston logger instance -
```javascript
const GoodWinston = require('good-winston');
const winston = require('winston');
const goodWinstonStream = new GoodWinston({ winston });
```

The following `config` options are availble to configure `GoodWinston`:
- `config` - required configuration object with the following keys
  - `winston` - winston logger (required).
  - `level` - Log level for internal events -
    - `error` - Map all good `error` events to this winston level (Default `error`).
    - `other` - Map all other good events to this winston level (Default `info`).
    - `ops` - Map all good `ops` events to this winston level (Default `info`).
    - `response` - Map all good `response` events to this winston level (Default `info`).
    - `request` - Map all good `request` events to this winston level (Default `undefined` so level will be deduced from tags).
  - `format` - [MomentJS](http://momentjs.com/docs/#/displaying/format/) format string. Defaults to 'YYMMDD/HHmmss.SSS'.
  - `utc` - boolean controlling Moment using [utc mode](http://momentjs.com/docs/#/parsing/utc/) or not. Defaults to `true`.
  - `color` - a boolean specifying whether to output in color. Defaults to `true`.

## Integrating with good
As with any good stream new `good-winston` you can either pass the created stream to good -
```javascript
const GoodWinston = require('good-winston');
const goodWinstonStream = new GoodWinston({ winston: require('winston') });
const good = require('good');


server.register({
  register: good,  
  options: {
    reporters:{
      winston: [ goodWinstonStream ]
    }
}, err => {
  if (err) {
    throw err;
  }
});
```

Or you can have good initiate the stream from the module for you -
```javascript
const winston = require('winston');
const good = require('good');

server.register({
  register: good,  
  options: {
    reporters:{
      winston: [{
        module: 'good-winston',
        args: [{ winston }]
      }]
    }
}, err => {
  if (err) {
    throw err;
  }
});
```

### Using Tags and Levels
Using the `level` parameter in the `config` variable you can set the log level for internal events that are not controlled from your code (like `ops` and `response`) but for logs where are called from your code you should set a tag with the appropriate log level .`good-winston` will iterate the tag and will set the level by the first tag that matches the `winston` logger available levels. If no appropriate level was found `other` level will be used