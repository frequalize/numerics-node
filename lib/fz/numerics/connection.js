(function() {
  var Connection, HTTP, QS;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  HTTP = require('http');
  QS = require('querystring');
  Connection = (function() {
    Connection.HOST = '127.0.0.1';
    Connection.PORT = 9000;
    Connection.BASE_PATH = '/ts';
    function Connection() {}
    Connection.prototype.list = function() {
      var callback, _, _i;
      _ = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      return this.coll_get(callback);
    };
    Connection.prototype.create = function() {
      var args, callback, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      return this.coll_post(args, callback);
    };
    Connection.prototype.about = function(timeseries, callback) {
      return this.get(timeseries, 'about', callback);
    };
    Connection.prototype.erase = function(timeseries, callback) {
      return this.destroy(timeseries, callback);
    };
    Connection.prototype.insert = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.post(timeseries, 'insert', this.write_args(args), callback);
    };
    Connection.prototype.remove = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.post(timeseries, 'remove', this.write_args(args), callback);
    };
    Connection.prototype.entries = function(timeseries, query, callback) {
      return this.get(timeseries, 'entries', query, callback);
    };
    Connection.prototype.series = function(timeseries, query, callback) {
      return this.get(timeseries, 'series', query, callback);
    };
    Connection.prototype.stats = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.get.apply(this, [timeseries, 'stats'].concat(__slice.call(args), [callback]));
    };
    Connection.prototype.distribution = function() {
      var args, callback, query, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      query = {};
      if (args.length > 0) {
        query['w'] = args[0];
      }
      return this.get(timeseries, 'distribution', query, callback);
    };
    Connection.prototype.properties = function(timeseries, callback) {
      return this.get(timeseries, 'properties', callback);
    };
    Connection.prototype.version = function(timeseries, callback) {
      return this.get(timeseries, 'version', callback);
    };
    Connection.prototype.draw = function(timeseries, query, callback) {
      return this.get(timeseries, 'draw', query, callback);
    };
    Connection.prototype.histogram = function() {
      var args, callback, query, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      query = {};
      if (args.length > 0) {
        query['w'] = args[0];
      }
      return this.get(timeseries, 'histogram', query, callback);
    };
    Connection.prototype.headline = function(timeseries, query, callback) {
      return this.get(timeseries, 'headline', query, callback);
    };
    Connection.prototype.trend = function(timeseries, query, callback) {
      return this.get(timeseries, 'trend', query, callback);
    };
    Connection.prototype.write_args = function(args) {
      var now, number, ordered_args, properties, time;
      now = new Date().toString();
      if (0 === args.length) {
        number = '1';
        time = now;
      } else if (1 === args.length) {
        if (this.is_numeric(args[0])) {
          number = '' + args[0];
          time = now;
        } else if (this.is_jsonic(args[0])) {
          number = '1';
          time = now;
          properties = args[0];
        } else {
          number = '1';
          time = args[0];
        }
      } else if (2 === args.length) {
        if (this.is_numeric(args[0])) {
          number = '' + args[0];
          if (this.is_jsonic(args[1])) {
            time = now;
            properties = args[1];
          } else {
            time = args[1];
          }
        } else if (this.is_jsonic(args[1])) {
          number = '1';
          time = args[0];
          properties = args[1];
        } else {
          throw "unclear args";
        }
      } else if (3 === args.length) {
        number = '' + args[0];
        time = '' + args[1];
        properties = args[2];
      } else {
        throw "too many args";
      }
      ordered_args = [time, number];
      if (properties != null) {
        if ('object' === typeof properties) {
          ordered_args.push(properties);
        } else {
          try {
            ordered_args.push(JSON.parse(properties));
          } catch (e) {
            throw "bad json arg: " + properties + " : " + e;
          }
        }
      }
      return ordered_args;
    };
    Connection.prototype.is_numeric = function(arg) {
      return ('number' === typeof arg) || ('' + arg).match(/^-?\d+(?:\.\d+)?$/);
    };
    Connection.prototype.is_jsonic = function(arg) {
      return ('object' === typeof arg) || ('{' === arg[0]);
    };
    Connection.prototype.coll_get = function(callback) {
      return this.send('GET', Connection.BASE_PATH, null, callback);
    };
    Connection.prototype.coll_post = function(args, callback) {
      return this.send('POST', Connection.BASE_PATH, JSON.stringify(args), callback);
    };
    Connection.prototype.get = function() {
      var callback, command, path, query, rest, timeseries;
      timeseries = arguments[0], command = arguments[1], rest = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (rest.length === 1) {
        callback = rest[0];
      } else {
        query = rest[0];
        callback = rest[1];
      }
      path = [Connection.BASE_PATH, (Array.isArray(timeseries) ? timeseries.join('/') : timeseries), command].join('/');
      if (query != null) {
        path += '?' + QS.stringify(query);
      }
      return this.send('GET', path, null, callback);
    };
    Connection.prototype.post = function(timeseries, command, args, callback) {
      return this.send('POST', [Connection.BASE_PATH, (Array.isArray(timeseries) ? timeseries.join('/') : timeseries), command].join('/'), JSON.stringify(args), callback);
    };
    Connection.prototype.destroy = function(timeseries, callback) {
      return this.send('DELETE', [Connection.BASE_PATH, (Array.isArray(timeseries) ? timeseries.join('/') : timeseries)].join('/'), null, callback);
    };
    Connection.prototype.send = function(method, path, body, callback) {
      var request;
      console.log("" + method + " " + path);
      request = HTTP.request({
        host: Connection.HOST,
        port: Connection.PORT,
        method: method,
        path: path
      }, __bind(function(response) {
        var data, done, err;
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
      if (false) {
        request.setHeader('Connection', 'Keep-Alive');
      } else {
        request.setHeader('Connection', 'Close');
      }
      if (body != null) {
        request.setHeader('Transfer-Encoding', 'normal');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Content-Length', body.length);
        request.write(body);
      }
      return request.end();
    };
    return Connection;
  })();
  exports.Connection = Connection;
}).call(this);
