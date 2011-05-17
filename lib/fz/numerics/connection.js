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
      return this.query(['insert', timeseries].concat(__slice.call(this.write_args(args))), false, callback);
    };
    Connection.prototype.remove = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['remove', timeseries].concat(__slice.call(this.write_args(args))), false, callback);
    };
    Connection.prototype.slice = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['slice', timeseries].concat(__slice.call(this.time_args(args))), false, callback);
    };
    Connection.prototype.range = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['range', timeseries].concat(__slice.call(this.number_args(args))), false, callback);
    };
    Connection.prototype.stats = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['stats', timeseries].concat(__slice.call(args)), false, callback);
    };
    Connection.prototype.distribution = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['distribution', timeseries].concat(__slice.call(args)), false, callback);
    };
    Connection.prototype.properties = function(timeseries, callback) {
      return this.query(['properties', timeseries], false, callback);
    };
    Connection.prototype.version = function(timeseries, callback) {
      return this.query(['version', timeseries], false, callback);
    };
    Connection.prototype.draw = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['draw', timeseries].concat(__slice.call(args)), false, callback);
    };
    Connection.prototype.histogram = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.query(['histogram', timeseries].concat(__slice.call(args)), false, callback);
    };
    Connection.prototype.time_args = function(args) {
      var arg, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        _results.push(['time', '' + arg]);
      }
      return _results;
    };
    Connection.prototype.number_args = function(args) {
      var arg, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = number_args.length; _i < _len; _i++) {
        arg = number_args[_i];
        _results.push(['number', '' + arg]);
      }
      return _results;
    };
    Connection.prototype.write_args = function(args) {
      var now, number, parsed_args, properties, sarg, sarg0, sarg1, time;
      now = new Date().toString();
      if (0 === args.length) {
        number = '1';
        time = now;
      } else if (1 === args.length) {
        sarg = '' + args[0];
        if (this.is_numeric(sarg)) {
          number = sarg;
          time = now;
        } else if (this.is_jsonic(sarg)) {
          number = '1';
          time = now;
          properties = sarg;
        } else {
          number = '1';
          time = sarg;
        }
      } else if (2 === args.length) {
        sarg0 = '' + args[0];
        sarg1 = '' + args[1];
        if (this.is_numeric(sarg0)) {
          number = sarg0;
          if (this.is_jsonic(sarg1)) {
            time = now;
            properties = sarg1;
          } else {
            time = sarg1;
          }
        } else if (this.is_jsonic(sarg1)) {
          number = '1';
          time = sarg0;
          properties = sarg1;
        } else {
          throw "unclear args";
        }
      } else if (3 === args.length) {
        number = '' + args[0];
        time = '' + args[1];
        properties = '' + args[2];
      } else {
        throw "too many args";
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
    Connection.prototype.is_numeric = function(arg) {
      return arg.match(/^-?\d+(?:\.\d+)?$/);
    };
    Connection.prototype.is_jsonic = function(arg) {
      return '{' === arg[0];
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
