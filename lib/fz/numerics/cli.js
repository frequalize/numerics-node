(function() {
  var CLI, Connection, sys;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  sys = require('sys');
  Connection = (require('fz/numerics/connection')).Connection;
  CLI = (function() {
    CLI.VERSION = '0.1';
    function CLI() {
      var arg, md, _i, _len, _ref;
      this.executable = process.argv.shift();
      this.script = process.argv.shift();
      this.options = [];
      this.args = [];
      this.log_level = null;
      _ref = process.argv;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        if (md = arg.match(/^-([a-z]*)$/i)) {
          this.options.push(md[1]);
        } else {
          this.args.push(arg);
        }
      }
      this.run();
    }
    CLI.prototype.run = function() {
      this.process_options();
      this.timeseries = this.args.shift();
      if (!(this.timeseries != null)) {
        this.help(1);
      }
      this.cmd = this.args.shift();
      if ((this.cmd != null) && this.cmd.match(/\//)) {
        this.timeseries = ['derivation', this.timeseries, this.cmd];
        this.cmd = this.args.shift();
      }
      switch (this.cmd) {
        case 'insert':
          return this.read_command();
        case 'remove':
          return this.read_command();
        case 'slice':
          return this.command();
        case 'range':
          return this.command();
        case 'view':
          return this.command();
        case 'stats':
          return this.command();
        case 'distribution':
          return this.command();
        case 'properties':
          return this.command();
        case 'version':
          return this.command();
        case 'draw':
          return this.command();
        case 'histogram':
          return this.command();
        case 'watch':
          return this.watch_command();
        case null:
          return this.help(1);
        default:
          return this.help(1);
      }
    };
    CLI.prototype.process_options = function() {
      var opt, _i, _len, _ref, _results;
      _ref = this.options;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        opt = _ref[_i];
        _results.push(this.process_option(opt));
      }
      return _results;
    };
    CLI.prototype.process_option = function(opt) {
      switch (opt) {
        case 'h':
          return this.help();
        case 'v':
          return this.log_level = 'info';
        case 'vv':
          return this.log_level = 'debug';
        case 'V':
          return this.version();
        case '':
          return this.read_mode = true;
        case 'j':
          return this.json_mode = true;
      }
    };
    CLI.prototype.error = function(err) {
      process.stderr.write(err);
      return process.stderr.write("\n");
    };
    CLI.prototype.success = function(data) {
      if (this.json_mode) {
        process.stdout.write(JSON.stringify(data));
        return process.stdout.write("\n");
      } else {
        return console.log(data);
      }
    };
    CLI.prototype.command = function() {
      var _ref;
      return (_ref = this.connection())[this.cmd].apply(_ref, [this.timeseries].concat(__slice.call(this.args), [__bind(function(err, data) {
        if (err) {
          return this.error(err);
        } else {
          return this.success(data);
        }
      }, this)]));
    };
    CLI.prototype.read_command = function() {
      var buffer;
      if (this.read_mode) {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        buffer = '';
        process.stdin.on('data', __bind(function(chunk) {
          return buffer += chunk;
        }, this));
        return process.stdin.on('end', __bind(function() {
          try {
            return this.json_command(JSON.parse(buffer));
          } catch (e) {
            throw this.error(e);
          }
        }, this));
      } else {
        return this.command();
      }
    };
    CLI.prototype.json_command = function(data) {
      var d, _i, _len, _results;
      if (Array.isArray(data)) {
        if (Array.isArray(data[0])) {
          _results = [];
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            d = data[_i];
            _results.push(this.json_command(d));
          }
          return _results;
        } else {
          this.args = [data[1], data[0], data[2]];
          return this.command();
        }
      } else {
        throw "can't deal with json input that looks like that";
      }
    };
    CLI.prototype.logger = function() {
      return this.lgr || (this.lgr = this.log_level ? null : null);
    };
    CLI.prototype.connection = function() {
      return this.conn || (this.conn = new Connection(this.logger()));
    };
    CLI.prototype.version = function() {
      sys.puts("" + this.script + " v" + CLI.VERSION);
      return process.exit();
    };
    CLI.prototype.help = function(status) {
      sys.puts('$ numerics [-h -v[v] ] <timeseries> [<aggregate>/<timespan>] [ <command> [<arg1> ...] ]\n\nCommands:\n  list                                        list your timeseries\n  insert [<number>] [<time>] [<properties>]   insert a value into the timeseries -- args can be ommited, a missing number means 1, a missing times means now\n  remove [<number>] [<time>] [<properties>]   remove -- args can only be ommited if the default would match what needs to be removed\n  stats                                       show accumulated stats for timeseries\n  properties                                  list the properties used in a timeseries\n  version                                     show the current version of the timeseries (<num of inserts>.<num of removals>)\n  slice [<start_time>] [<end_time>]           show times, number, properties values\n  range [<start_index>] [<end_index>]         show times, number, properties values\n  distribution [<bin_width> [<start_time>] [<end_time>]    show distribution of values in the timeseries\n  draw  [<start_time>] [<end_time>]           draw an ascii timeseries (on derived timeseries only)\n  histogram  [<start_time>] [<end_time>]      draw an ascii histogram of the distribution\n\nArgs:\n <aggregate>/<timespan>                       derive a normalized timeseries = one entry for every <timespan> of the original series, with multiple entries being aggregayed according to <aggregate>\n   <aggregate> values:  mean, total, @@etc or mean+, total+, etc = the + suffix indicates a cumulative aggregation\n   <timespace> values:  day, minute, second, month, year @@@etc\n\nOptions:\n  -h                                      display this and exit\n  -v(v)                                   (extra) verbose logging\n  -V                                      print version and exit\n\n');
      if (typeof stats === "undefined" || stats === null) {
        status = 1;
      }
      return process.exit(status);
    };
    return CLI;
  })();
  exports.CLI = CLI;
}).call(this);
