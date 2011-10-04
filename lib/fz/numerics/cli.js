(function() {
  var CLI, Connection, sys;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  sys = require('sys');
  Connection = (require('fz/numerics/connection')).Connection;
  CLI = (function() {
    CLI.VERSION = '0.1';
    function CLI() {
      var arg, collect_cmd_opt, md, _i, _len, _ref;
      this.executable = process.argv.shift();
      this.script = process.argv.shift();
      this.options = [];
      this.args = [];
      this.log_level = null;
      this.cmd_opts = {};
      collect_cmd_opt = null;
      _ref = process.argv;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        if (collect_cmd_opt) {
          this.cmd_opts[collect_cmd_opt] = arg;
          collect_cmd_opt = null;
        } else if (md = arg.match(/^-([a-z]*)$/i)) {
          this.options.push(md[1]);
        } else if (md = arg.match(/^--([a-z]+)$/i)) {
          collect_cmd_opt = md[1];
        } else {
          this.args.push(arg);
        }
      }
      this.run();
    }
    CLI.prototype.run = function() {
      this.process_options();
      this.timeseries = this.args.shift();
      this.cmd = this.args.shift();
      if ('list' === this.timeseries && !(this.cmd != null)) {
        this.timeseries = null;
        this.cmd = 'list';
      }
      if ((this.cmd != null) && this.cmd.match(/\//)) {
        this.timeseries = [this.timeseries, this.cmd];
        this.cmd = this.args.shift();
      }
      if ((this.timeseries != null) && !(this.cmd != null)) {
        this.cmd = 'headline';
      }
      switch (this.cmd) {
        case 'list':
          return this.command();
        case 'about':
          return this.command();
        case 'create':
          return this.command();
        case 'erase':
          return this.command();
        case 'insert':
          return this.read_command();
        case 'remove':
          return this.read_command();
        case 'entries':
          return this.opts_command();
        case 'series':
          return this.opts_command();
        case 'stats':
          return this.command();
        case 'distribution':
          return this.command();
        case 'properties':
          return this.command();
        case 'version':
          return this.command();
        case 'draw':
          return this.opts_command();
        case 'histogram':
          return this.command();
        case 'headline':
          return this.opts_command();
        case 'trend':
          return this.opts_command();
        case 'watch':
          return this.watch_command();
        default:
          return this.help(1, true);
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
      process.stderr.write('Error: ' + err);
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
    CLI.prototype.opts_command = function() {
      this.args = [this.cmd_opts];
      return this.command();
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
      var i, run_next;
      if (Array.isArray(data)) {
        if (Array.isArray(data[0])) {
          i = 0;
          run_next = __bind(function() {
            this.json_command(data[i]);
            i++;
            if (i < data.length) {
              return setTimeout(run_next, 500);
            }
          }, this);
          return run_next();
        } else {
          this.args = [data[1], data[0], data[2]];
          return this.command();
        }
      } else {
        throw "can't deal with json input that looks like that";
      }
    };
    CLI.prototype.watch_command = function() {
      var _ref;
      return (_ref = this.connection()).subscribe.apply(_ref, [this.timeseries].concat(__slice.call(this.args), [__bind(function(version, stats) {
        return this.success([version, stats]);
      }, this)]));
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
    CLI.prototype.help = function(status, short) {
      console.log('$ numerics [-h -v[v] -j ] [<timeseries>] [<metric>[<suffix>]/<timespan>] <command> [<arg1> ...] [<command options>]');
      if (!short) {
        console.log('Commands:\n  list                                        list your timeseries (no <timeseries> arg in this case)\n  insert [<number>] [<time>] [<properties>]   insert a value into the timeseries -- args can be ommited, a missing number means 1, a missing times means now\n  remove [<number>] [<time>] [<properties>]   remove -- args can only be ommited if the default would match what needs to be removed\n  about                                       show metadata for a timeseries\n  create [<number>]                           create a new empty timeseries - only really necessary if you want to specify a specific precision with <number>, otherwise they are auto-created on insert\n  erase                                       remove all data from a timeseries and erase its metadata\n  stats                                       show accumulated stats for timeseries\n  properties                                  list the properties used in a timeseries\n  version                                     show the current version of the timeseries (<num of inserts>.<num of removals>)\n  entries [time or index options]             show time, number, properties values for the raw timeseries\n  series [time or index options]              separate time and number series for the raw timeseries\n  distribution [<bin_width>] [<first_bin_start>]  show distribution of values in the timeseries\n  draw  [time or index options]               draw an ascii timeseries (on derived timeseries only - will use the default derivation if no derivation specified)\n  histogram  [<bin_width>] [<first_bin_start>]    draw an ascii histogram of the distribution\n  headline [--t[imespan] <timespan>] [--m[etric] <metric>] [--b[efore] <time>]]  give the headline value for a timeseries = the value of <metric> over the last <timespan> (uses metric and timespan from default derivation if none given) before <time> or now\n  trend  [time or index options]              calculate a linear regression trend over the specified period (on derived timeseries only - will use the default derivation if no derivation specified)\n  watch <event>                               watch for <event> changes\n\n  <metric>[<suffix>]/<timespan>               derive a normalized timeseries = one entry for every <timespan> of the original series, with multiple entries being aggregated according to <metric>\n   <metric> values:  mean, total, count, median, etc@@\n   <suffix> values: +, - or % => + indicates a cumulative aggregation, - a step-wise difference, % the percentage drift from stating datum\n   <timespan> values:  day, minute, second, month, year @@@etc or 7day, 40minute etc\n\nCommand options:\n time/index options:\n  --from   start time\n  --to     end time @@inclusive @@???\n  --start  start index (can be negative to count from end)\n  --end    end index @@inclusive @@??? (can be negative to count from end)\n  --limit  max mumber of entries to return\n examples:\n   --limit 10 => the last 10 entries\n   --from "2011-01-01" --to "2011-02-01" => all entries in Jan 2011 @@inclusive? fix\n   --to yesterday --limit 10 => the last 10 entries before yesterday @@ todo\n   --start 0 --end 100 => the first @@@101 (fix inclusive??) entries\n   --start -10 => the last 10@@check entries\n\n Value options:\n  @@todo\n\nEvents:\n stats   emits the version data and stats whenever the stats change\n\nGeneral options:\n  -h                                      JSON output\n  -h                                      display this and exit\n  -v(v)                                   (extra) verbose logging\n  -V                                      print version and exit\n');
      }
      return process.stdout.flush(__bind(function() {
        if (typeof stats === "undefined" || stats === null) {
          status = 1;
        }
        return process.exit(status);
      }, this));
    };
    return CLI;
  })();
  exports.CLI = CLI;
}).call(this);
