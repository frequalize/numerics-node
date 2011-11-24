(function() {
  var Connection, HTTPS, QS, SIO;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  HTTPS = require('https');
  QS = require('querystring');
  SIO = require('socket.io-client');
  Connection = (function() {
    Connection.VERSION = '0.6.0';
    Connection.HOST = 'api.numerics.io';
    Connection.PORT = 443;
    Connection.BASE_PATH = '/ts';
    Connection.EVENT_RESOURCE = 'event';
    function Connection(access_key, secret_key, host, port) {
      this.access_key = access_key;
      this.secret_key = secret_key;
      this.host = host != null ? host : Connection.HOST;
      this.port = port != null ? port : Connection.PORT;
    }
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
    Connection.prototype.describe = function() {
      var args, callback, timeseries, _i;
      timeseries = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      return this.put.apply(this, [timeseries, 'describe'].concat(__slice.call(args), [callback]));
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
        query['s'] = args[1];
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
        query['s'] = args[1];
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
    Connection.prototype.put = function(timeseries, command, args, callback) {
      return this.send('PUT', [Connection.BASE_PATH, (Array.isArray(timeseries) ? timeseries.join('/') : timeseries), command].join('/'), JSON.stringify(args), callback);
    };
    Connection.prototype.destroy = function(timeseries, callback) {
      return this.send('DELETE', [Connection.BASE_PATH, (Array.isArray(timeseries) ? timeseries.join('/') : timeseries)].join('/'), null, callback);
    };
    Connection.prototype.send = function(method, path, body, callback) {
      var request;
      console.log("" + method + " " + path);
      if (body != null) {
        console.log("BODY: " + body + ")");
      }
      request = HTTPS.request({
        host: this.host,
        port: this.port,
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
      request.setHeader('User-Agent', 'numerics-node v' + Connection.VERSION);
      request.setHeader('X-Access-Key', this.access_key);
      request.setHeader('X-Secret-Key', this.secret_key);
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
    Connection.prototype.subscribe = function() {
      var callback, event, events, timeseries, _base, _base2, _i, _j, _len;
      timeseries = arguments[0], events = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
      this.subscriptions || (this.subscriptions = {});
      (_base = this.subscriptions)[timeseries] || (_base[timeseries] = {});
      for (_j = 0, _len = events.length; _j < _len; _j++) {
        event = events[_j];
        (_base2 = this.subscriptions[timeseries])[event] || (_base2[event] = []);
        this.subscriptions[timeseries][event].push(callback);
      }
      return this.with_ws_client(__bind(function(ws) {
        return ws.emit('message', ['subscribe', timeseries, events]);
      }, this));
    };
    Connection.prototype.ws_client_url = function() {
      var url_parts;
      url_parts = ['wss:', this.host, ':', this.port, '?ak=', this.access_key];
      url_parts.push('&');
      url_parts.push('sk');
      url_parts.push('=');
      url_parts.push(this.secret_key);
      return url_parts.join('');
    };
    Connection.prototype.with_ws_client = function(callback) {
      if (this.ws) {
        return callback(this.ws);
      } else {
        SIO.transports = ['xhr-polling'];
        return this.setup_ws_client(SIO.connect(this.ws_client_url(), {
          resource: Connection.EVENT_RESOURCE,
          secure: true
        }), callback);
      }
    };
    Connection.prototype.setup_ws_client = function(ws, callback) {
      ws.on('connect', __bind(function() {
        this.ws = ws;
        return callback(ws);
      }, this));
      ws.on('disconnect', __bind(function() {
        console.error('ws disconnect');
        return this.ws = null;
      }, this));
      ws.on('message', __bind(function(msg) {
        var cb, data, event, ts, _i, _len, _ref, _results;
        ts = msg[0], event = msg[1], data = 3 <= msg.length ? __slice.call(msg, 2) : [];
        if (ts && event && this.subscriptions[ts] && this.subscriptions[ts][event]) {
          _ref = this.subscriptions[ts][event];
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cb = _ref[_i];
            _results.push(cb.apply(null, data));
          }
          return _results;
        } else {
          return console.error('invalid server response');
        }
      }, this));
      return ws.on('error', __bind(function(err) {
        return console.error('ws error', err);
      }, this));
    };
    return Connection;
  })();
  exports.Connection = Connection;
}).call(this);
