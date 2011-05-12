(function() {
  var CLI, Connection, http, sys;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  sys = require('sys');
  http = require('http');
  Connection = (function() {
    Connection.HOST = '127.0.0.1';
    Connection.PORT = 3006;
    Connection.QUERY_OPTIONS = {
      host: Connection.HOST,
      port: Connection.PORT,
      method: 'POST',
      path: '/query'
    };
    function Connection() {}
    Connection.prototype.insert = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['insert', timeseries].concat(__slice.call(this.parse_write_args(args))), false, callback);
    };
    Connection.prototype.remove = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['remove', timeseries].concat(__slice.call(this.parse_write_args(args))), false, callback);
    };
    Connection.prototype.slice = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['slice', timeseries].concat(__slice.call(this.parse_time_args(args))), false, callback);
    };
    Connection.prototype.range = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['range', timeseries].concat(__slice.call(this.parse_number_args(args))), false, callback);
    };
    Connection.prototype.derive = function() {
      var args, callback, derivation_spec, timeseries, _i;
      timeseries = arguments[0], derivation_spec = arguments[1], args = 4 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 1) : (_i = 2, []), callback = arguments[_i++];
      return this.query(['derive', timeseries, derivation_spec].concat(__slice.call(this.parse_number_args(args))), false, callback);
    };
    Connection.prototype.stats = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['stats', timeseries].concat(__slice.call(args)), false, callback);
    };
    Connection.prototype.properties = function(timeseries, callback) {
      return this.query(['properties', timeseries], false, callback);
    };
    Connection.prototype.parse_time_args = function(args) {
      var arg, json_args, number_args, word_args, _i, _len, _ref, _results;
      _ref = this.split_args(args), number_args = _ref[0], word_args = _ref[1], json_args = _ref[2];
      _results = [];
      for (_i = 0, _len = number_args.length; _i < _len; _i++) {
        arg = number_args[_i];
        _results.push(['time', '' + arg]);
      }
      return _results;
    };
    Connection.prototype.parse_number_args = function(args) {
      var arg, json_args, number_args, word_args, _i, _len, _ref, _results;
      _ref = this.split_args(args), number_args = _ref[0], word_args = _ref[1], json_args = _ref[2];
      _results = [];
      for (_i = 0, _len = number_args.length; _i < _len; _i++) {
        arg = number_args[_i];
        _results.push(['number', '' + arg]);
      }
      return _results;
    };
    Connection.prototype.parse_write_args = function(args) {
      var candidate_time, json_args, now, number, number_args, parsed_args, properties, time, word_args, _ref;
      now = new Date();
      _ref = this.split_args(args), number_args = _ref[0], word_args = _ref[1], json_args = _ref[2];
      if (0 === number_args.length) {
        number = '1';
      } else if (1 === number_args.length) {
        number = number_args[0];
      } else if (2 === number_args.length) {
        number = number_args[0];
        time = number_args[1];
      } else {
        throw "bad number of number-like args";
      }
      if (1 === word_args.length) {
        candidate_time = (function() {
          switch (word_args[0]) {
            case 'now':
              return now;
            default:
              return null;
          }
        })();
        if (candidate_time != null) {
          if (time != null) {
            throw "time found as both number and word";
          } else {
            time = candidate_time;
          }
        }
      } else if (word_args.length > 1) {
        throw "bad number of word-like args";
      }
      if (1 === json_args.length) {
        properties = json_args[0];
      } else if (json_args.length > 1) {
        throw "bad number of json-like args";
      }
      if (!(time != null)) {
        time = now;
      }
      parsed_args = [['time', time], ['number', number]];
      if (properties != null) {
        try {
          parsed_args.push(['json', JSON.parse(properties)]);
        } catch (e) {
          throw "bad json arg: " + properties + " : " + e;
        }
      }
      console.log(parsed_args);
      return parsed_args;
    };
    Connection.prototype.split_args = function(args) {
      var arg, json_args, number_args, sarg, word_args, _i, _len;
      number_args = [];
      word_args = [];
      json_args = [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        sarg = '' + arg;
        if (sarg.match(/^-?\d+(?:\.\d+)?$/)) {
          number_args.push(sarg);
        } else if (sarg.match(/^[0-9a-z_\- ]+$/)) {
          word_args.push(sarg);
        } else if ('{' === sarg[0]) {
          json_args.push(sarg);
        } else {
          throw "bad arg: " + sarg;
        }
      }
      return [number_args, word_args, json_args];
    };
    Connection.prototype.query = function(query, keep_alive, callback) {
      var request;
      console.log(query);
      request = http.request(Connection.QUERY_OPTIONS, __bind(function(response) {
        var body, data, done, err;
        err = null;
        data = null;
        done = function() {
          if (callback) {
            return callback(err, data);
          }
        };
        body = '';
        response.on('data', __bind(function(chunk) {
          return body += chunk;
        }, this));
        return response.on('end', __bind(function() {
          var _ref;
          try {
            _ref = __slice.call(JSON.parse(body)), err = _ref[0], data = _ref[1];
          } catch (e) {
            err = 'invalid server response';
          }
          return done();
        }, this));
      }, this));
      request.setHeader('Transfer-Encoding', 'normal');
      request.setHeader('Content-Type', 'application/json');
      if (keep_alive) {
        request.setHeader('Connection', 'Keep-Alive');
      } else {
        request.setHeader('Connection', 'Close');
      }
      request.write(JSON.stringify(query));
      return request.end();
    };
    return Connection;
  })();
  CLI = (function() {
    function CLI() {
      this.executable = process.argv.shift();
      this.script = process.argv.shift();
      this.options = process.argv;
      this.run();
    }
    CLI.prototype.run = function() {
      var cmd;
      cmd = this.options.shift();
      switch (cmd) {
        case 'insert':
          return this.command(cmd);
        case 'remove':
          return this.command(cmd);
        case 'slice':
          return this.command(cmd);
        case 'range':
          return this.command(cmd);
        case 'derive':
          return this.command(cmd);
        case 'view':
          return this.command(cmd);
        case 'stats':
          return this.command(cmd);
        case 'properties':
          return this.command(cmd);
        case 'watch':
          return this.watch_command();
        case 'help':
          return this.help();
        case null:
          return this.help();
        default:
          return this.help();
      }
    };
    CLI.prototype.command = function(cmd) {
      var timeseries, _ref;
      timeseries = this.options.shift();
      if (timeseries) {
        return (_ref = this.connection())[cmd].apply(_ref, [timeseries].concat(__slice.call(this.options), [__bind(function(err, data) {
          if (err) {
            return console.log('error: ' + err);
          } else {
            return console.log(data);
          }
        }, this)]));
      }
    };
    CLI.prototype.connection = function() {
      return this.conn || (this.conn = new Connection());
    };
    CLI.prototype.help = function() {
      return sys.puts("numerics list | insert <timeseries> [args] | remove <timeseries> [args] | stats <timeseries> [<aggregate>/<timespan>] [options] | view <timeseries> [<aggregate>/<timespan>] [options] | watch <timeseries> [<aggregate>/<timespan>]");
    };
    return CLI;
  })();
  exports.Numerics = {
    CLI: CLI,
    Connection: Connection
  };
}).call(this);
