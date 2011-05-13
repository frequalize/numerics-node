(function() {
  var Connection, http;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
    Connection.prototype.stats = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['stats', timeseries].concat(__slice.call(args)), false, callback);
    };
    Connection.prototype.properties = function(timeseries, callback) {
      return this.query(['properties', timeseries], false, callback);
    };
    Connection.prototype.version = function(timeseries, callback) {
      return this.query(['version', timeseries], false, callback);
    };
    Connection.prototype.parse_time_args = function(args) {
      var arg, json_args, number_args, time_args, word_args, _ref;
      _ref = this.split_args(args), number_args = _ref[0], word_args = _ref[1], time_args = _ref[2], json_args = _ref[3];
      return ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = number_args.length; _i < _len; _i++) {
          arg = number_args[_i];
          _results.push(['time', '' + arg]);
        }
        return _results;
      })()).concat((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = time_args.length; _i < _len; _i++) {
          arg = time_args[_i];
          _results.push(['time', '' + arg]);
        }
        return _results;
      })());
    };
    Connection.prototype.parse_number_args = function(args) {
      var arg, json_args, number_args, time_args, word_args, _i, _len, _ref, _results;
      _ref = this.split_args(args), number_args = _ref[0], word_args = _ref[1], time_args = _ref[2], json_args = _ref[3];
      _results = [];
      for (_i = 0, _len = number_args.length; _i < _len; _i++) {
        arg = number_args[_i];
        _results.push(['number', '' + arg]);
      }
      return _results;
    };
    Connection.prototype.parse_write_args = function(args) {
      var candidate_time, json_args, now, number, number_args, parsed_args, properties, time, time_args, word_args, _ref;
      now = new Date();
      _ref = this.split_args(args), number_args = _ref[0], word_args = _ref[1], time_args = _ref[2], json_args = _ref[3];
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
            throw "time found too many times";
          } else {
            time = candidate_time;
          }
        }
      } else if (word_args.length > 1) {
        throw "bad number of word-like args";
      }
      if (1 === time_args.length) {
        if (time != null) {
          throw "time found too many times";
        } else {
          time = time_args[0];
        }
      } else if (time_args.length > 1) {
        throw "bad number of time-like args";
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
      var arg, json_args, number_args, sarg, time_args, word_args, _i, _len;
      number_args = [];
      word_args = [];
      time_args = [];
      json_args = [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        sarg = '' + arg;
        if (sarg.match(/^-?\d+(?:\.\d+)?$/)) {
          number_args.push(sarg);
        } else if (sarg.match(/^[0-9a-z_\- ]+$/i)) {
          word_args.push(sarg);
        } else if (sarg.match(/^[0-9\-+: ]+$/)) {
          time_args.push(sarg);
        } else if ('{' === sarg[0]) {
          json_args.push(sarg);
        } else {
          throw "bad arg: " + sarg;
        }
      }
      return [number_args, word_args, time_args, json_args];
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
  exports.Connection = Connection;
}).call(this);
