(function() {
  var CLI, Connection, fs, path;
  var __slice = Array.prototype.slice;

  fs = require('fs');

  path = require('path');

  Connection = (require('./connection')).Connection;

  CLI = (function() {

    CLI.VERSION = '0.8';

    function CLI(config_dir) {
      var arg, collect_cmd_opt, md, _i, _len, _ref;
      this.config_dir = config_dir != null ? config_dir : './.numerics';
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

    CLI.prototype.ensure_config = function() {
      var current_key_file, f, md, _i, _len, _ref;
      if (!(this.key_files != null)) {
        if (path.existsSync(this.config_dir)) {
          this.key_files = {};
          _ref = fs.readdirSync(this.config_dir);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            f = _ref[_i];
            if (md = f.match(/(.+)?\.json$/)) this.key_files[md[1]] = f;
          }
          current_key_file = path.join(this.config_dir, 'current_key');
          if (path.existsSync(current_key_file)) {
            return this.set_key(fs.readFileSync(current_key_file));
          }
        } else {
          return this.error(("No " + this.config_dir + " directory found\n") + (" To configure numerics, create the " + this.config_dir + " directory\n") + " and copy access key JSON files into it from https://numerics.io/");
        }
      }
    };

    CLI.prototype.ensure_key = function() {
      this.ensure_config();
      if (!(this.key != null)) {
        return this.error("No current key/project set, use:\n" + " $ numerics key <access key>\n" + "  or:\n" + " $ numerics project <project name or id>\n" + "  to set.");
      }
    };

    CLI.prototype.keys = function() {
      var f, k, _ref, _results;
      this.ensure_config();
      _ref = this.key_files;
      _results = [];
      for (k in _ref) {
        f = _ref[k];
        _results.push(JSON.parse(fs.readFileSync(path.join(this.config_dir, f))));
      }
      return _results;
    };

    CLI.prototype.projects = function() {
      var k, pn, ps, _i, _len, _ref;
      ps = [];
      _ref = this.keys();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        pn = k.project.name;
        if (!(ps.indexOf(pn) > -1)) ps.push(pn);
      }
      return ps;
    };

    CLI.prototype.list_keys = function() {
      return console.log(this.keys());
    };

    CLI.prototype.current_key = function() {
      this.ensure_key();
      return console.log(this.key);
    };

    CLI.prototype.set_key = function(akk, write_file) {
      var kf;
      this.ensure_config();
      if (kf = this.key_files[akk]) {
        this.key = JSON.parse(fs.readFileSync(path.join(this.config_dir, kf)));
        if (write_file) {
          return fs.writeFileSync(path.join(this.config_dir, 'current_key'), this.key.key);
        }
      } else {
        return this.error("Unknown key: " + akk);
      }
    };

    CLI.prototype.list_projects = function() {
      return console.log(this.projects());
    };

    CLI.prototype.current_project = function() {
      this.ensure_key();
      return console.log(this.key.project);
    };

    CLI.prototype.set_project = function(prj) {
      var k, picked_key, _i, _len, _ref;
      picked_key = null;
      _ref = this.keys();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        if ((('' + k.project.id) === prj || k.project.name === prj) && k.permissions === 'rwm') {
          picked_key = k;
          break;
        }
      }
      if (picked_key) {
        return this.set_key(picked_key.key, true);
      } else {
        return console.error("No key with rwm permissions for project " + prj + " -- use key command instead");
      }
    };

    CLI.prototype.run = function() {
      this.process_options();
      this.timeseries = this.args.shift();
      this.cmd = this.args.shift();
      if ({
        list: true,
        keys: true,
        projects: true,
        help: true
      }[this.timeseries] && !(this.cmd != null)) {
        this.cmd = this.timeseries;
        this.timeseries = null;
      } else if ({
        key: true,
        project: true
      }[this.timeseries]) {
        this.internal_arg = this.cmd;
        this.cmd = this.timeseries;
        this.timeseries = null;
      }
      if ((this.cmd != null) && this.cmd.match(/\//)) {
        this.timeseries = [this.timeseries, this.cmd];
        this.cmd = this.args.shift();
      } else if ((this.cmd != null) && this.cmd.match(/\=/)) {
        this.timeseries = [this.timeseries, this.cmd];
        this.cmd = this.args.shift();
      }
      if ((this.timeseries != null) && !(this.cmd != null)) this.cmd = 'about';
      switch (this.cmd) {
        case 'keys':
          return this.list_keys();
        case 'key':
          if (this.internal_arg) {
            return this.set_key(this.internal_arg, true);
          } else {
            return this.current_key();
          }
          break;
        case 'projects':
          return this.list_projects();
        case 'project':
          if (this.internal_arg) {
            return this.set_project(this.internal_arg);
          } else {
            return this.current_project();
          }
          break;
        case 'list':
          return this.command();
        case 'about':
          return this.command();
        case 'create':
          return this.command();
        case 'describe':
          return this.opts_command();
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
        case 'stats_per':
          return this.command();
        case 'stats_without_zeros':
          return this.command();
        case 'tally_of':
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
        case 'help':
          return this.help();
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
        case 't':
          return this.throttle = true;
      }
    };

    CLI.prototype.error = function(err) {
      console.error('Error: ' + err);
      return process.exit(1);
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
      var _this = this;
      return (_ref = this.connection())[this.cmd].apply(_ref, [this.timeseries].concat(__slice.call(this.args), [function(err, data) {
        if (err) {
          return _this.error(err);
        } else {
          return _this.success(data);
        }
      }]));
    };

    CLI.prototype.opts_command = function() {
      this.args = [this.cmd_opts];
      return this.command();
    };

    CLI.prototype.read_command = function() {
      var buffer;
      var _this = this;
      if (this.read_mode) {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        buffer = '';
        process.stdin.on('data', function(chunk) {
          return buffer += chunk;
        });
        return process.stdin.on('end', function() {
          try {
            return _this.json_command(JSON.parse(buffer));
          } catch (e) {
            throw _this.error(e);
          }
        });
      } else {
        return this.command();
      }
    };

    CLI.prototype.json_command = function(data) {
      var i, run_next;
      var _this = this;
      if (Array.isArray(data)) {
        if (Array.isArray(data[0])) {
          i = 0;
          run_next = function() {
            _this.json_command(data[i]);
            i++;
            if (i < data.length) {
              if (_this.throttle) {
                return setTimeout(run_next, 500);
              } else {
                return run_next();
              }
            }
          };
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
      var _this = this;
      if (this.args.length > 0) {
        return (_ref = this.connection()).subscribe.apply(_ref, [this.timeseries].concat(__slice.call(this.args), [function(data) {
          return _this.success(data);
        }]));
      } else {
        return this.help(1, true);
      }
    };

    CLI.prototype.logger = function() {
      return this.lgr || (this.lgr = this.log_level ? null : null);
    };

    CLI.prototype.connection = function() {
      this.ensure_key();
      return this.conn || (this.conn = new Connection(this.key.key, this.key.secret_key, this.key.host, this.key.port));
    };

    CLI.prototype.version = function() {
      console.log("" + (this.script.match(/.*\/(.+?)$/)[1]) + " v" + CLI.VERSION);
      return process.exit();
    };

    CLI.prototype.help = function(status, short) {
      var text;
      text = [' $ numerics [switches] [<timeseries>] [<metric>[<suffix>]/<timespan> | <property>=[<value>]] <command> [args...] [<command options>]', '', '  Commands:', '', '    list                                        list your timeseries (no <timeseries> arg in this case)', '    about                                       show metadata for a timeseries', '', '    insert [<number>] [<time>] [<properties>]   insert a value into the timeseries -- args can be ommited, a missing number means 1, a missing times means now', '    remove [<number>] [<time>] [<properties>]   remove -- args can only be ommited if the default would match what needs to be removed', '    create [<number>]                           create a new empty timeseries - only necessary if you want to specify a specific precision (<number>)', '                                                  otherwise timeseries are auto-created on insert', '    erase                                       remove all data from a timeseries and erase its metadata', '    describe [--d <description>] [--u <units>]  set a description and the units for the timeseries -- used in the dashboard/UI', '', '    stats                                       show accumulated stats for timeseries', '    properties                                  list the properties used in a timeseries', '    stats_per <property>                        show accumulated stats for the timeseries, but using the number of unique values of <property>', '                                                    as the count, not the number of entries. Note that the total will be the total for all entries,', '                                                    not just those with the property -- if you want that, filter the ts too', '    stats_without_zeros                         show accumulated stats for timeseries, but ignoring any values of zero in the timeseries', '    tally_of <value>                            show the number of times <value> appears in the timeseries', '    version                                     show the current version data for the timeseries', '', '    entries [time/index options]                show time, number, properties values for the raw timeseries', '    series [time/index options]                 separate time and number series for the raw timeseries', '', '    distribution [<bin_width>] [<first_bin_start>]  show distribution of values in the timeseries', '    headline [--t <timespan>] [--m <metric>] [--b <time>]]  give the headline value for a timeseries = the value of <metric> over the last <timespan>', '                                                              before <time> or now - uses metric and timespan from default derivation if none given', '    trend  [time/index options]                 calculate a linear regression trend over the specified period (derived timeseries only - will use the', '                                                  default derivation if no derivation specified)', '    watch <event>                               watch for <event> changes', '', '    draw  [time or index options]               draw an ascii timeseries (derived timeseries only - default derivation used if no derivation specified)', '    histogram  [<bin_width>] [<first_bin_start>]    draw an ascii histogram of the distribution', '', '  Derived timeseries:', '', '    <metric>[<suffix>]/<timespan>               derive a normalized timeseries = one entry for every <timespan> of the original series, with multiple entries being aggregated according to <metric>', '      metric values:                            mean, total, count, median, etc@@', '      suffix values:                            +, - or %  (+ indicates a cumulative aggregation, - a step-wise difference, % the percentage drift from stating datum)', '      timespan values:                          day, minute, second, month, year @@@etc or 7day, 40minute, etc', '', '  Filtered timeseries:', '', '    <property>=[<value>]                        filtered timeseries taking only entries from the original that have the property <property>, and the <value> if present', '', '  Command options:', '', '    time/index options:', '      --from                                    start time', '      --to                                      end time @@inclusive @@???', '      --start                                   start index (can be negative to count from end)', '      --end                                     end index @@inclusive @@??? (can be negative to count from end)', '      --limit                                   max mumber of entries to return', '    examples:', '      --limit 10                                the last 10 entries', '      --from "2011-01-01" --to "2011-02-01"     all entries in Jan 2011 @@inclusive? fix', '      --to yesterday --limit 10                 the last 10 entries before yesterday @@ todo', '      --start 0 --end 100                       the first @@@101 (fix inclusive??) entries', '      --start -10                               the last 10@@check entries', '', '    events:', '      version   emits the version data whenever an entry is added or removed', '', '  Switches:', '', '    -h                                          display this and exit', '    -V                                          print version and exit', '    -v(v)                                       (extra) verbose logging', '    -                                           read the args for the command from stdin - piping in a JSON array of arrays allows multiple calls', '    -t                                          throttle requests (2 per second) when reading args from stdin', '    -j                                          JSON output @@??##todo', '', '  Configuration commands:', '', '    key [<access_key>]                          show or set the access key used to connect to numerics.io', '                                                 There must be file named <access_key>.json in a directory named .numerics in the current directory', '                                                 <access_key>.json files can be downloaded from https://numerics.io', '    project [<access name or id>]               show or set the access key used to connect to numerics.io by nameing the project or giving the  project id', '                                                 There must be .json file in the .numerics directory with matching details and with rwm permissions', '    keys                                        show the keys avilable to use (= .json files in .numerics)', '    projects                                    show the project names avilable to use (= .json files in .numerics)', ''];
      if (short) {
        console.log(text[0]);
      } else {
        console.log(text.join("\n"));
      }
      if (status == null) status = 1;
      return process.exit(status);
    };

    return CLI;

  })();

  exports.CLI = CLI;

}).call(this);
