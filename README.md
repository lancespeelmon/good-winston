# good-winston

A [hapi][0] [good-reporter][1] to [winston][2] adapter.

## Installation

``` bash
  $ npm install winston
  $ npm install good-winston
```

## Usage

To use the `GoodWinston` transport in winston, you simply need to require it and
then either add it to an existing winston logger or pass an instance to a new
winston logger:

``` js
var GoodWinston = require('good-winston');
var winston = require('winston');

server.register({
  register: require('good'),
  options: {
    reporters: [
      new GoodWinston({
        ops: '*',
        request: '*',
        response: '*',
        log: '*',
        error: '*'
      }, winston)
    ]
  }
}, function(err) {
  if (err) {
    return server.log(['error'], 'good load error: ' + err);
  }
});
```

The following `options` are availble to configure `GoodWinston`:

* __level:__ Map all good events to this winston level (Default `info`).

[0]: http://hapijs.com
[1]: https://github.com/hapijs/good-reporter
[2]: https://github.com/winstonjs/winston
