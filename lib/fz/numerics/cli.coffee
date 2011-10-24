sys = require 'sys'
Connection = (require 'fz/numerics/connection').Connection

# Fz.Numerics.CLI
class CLI

  @VERSION = '0.1'

  constructor : () ->
    @executable = process.argv.shift()
    @script = process.argv.shift()
    @options = []
    @args = []
    @log_level = null

    @cmd_opts = {}
    collect_cmd_opt = null

    for arg in process.argv
      if collect_cmd_opt
        @cmd_opts[collect_cmd_opt] = arg
        collect_cmd_opt = null
      else if md = arg.match(/^-([a-z]*)$/i)
        @options.push md[1]
      else if md = arg.match(/^--([a-z]+)$/i)
        collect_cmd_opt = md[1]
      else
        @args.push arg

    this.run()

  run: () ->

    this.process_options()

    @timeseries = @args.shift()

    @cmd = @args.shift()

    if 'list' == @timeseries && !@cmd?
      @timeseries = null
      @cmd = 'list'

    if @cmd? && @cmd.match(/\//)
      @timeseries = [@timeseries, @cmd] # cmd is really a derivation spec
      @cmd = @args.shift()

    if @timeseries? && !@cmd?
      @cmd = 'headline' ## default

    switch @cmd
      when 'list'
        this.command()
      when 'about'
        this.command()
      when 'create'
        this.command()
      when 'describe'
        this.opts_command()
      when 'erase'
        this.command()
      when 'insert'
        this.read_command()
      when 'remove'
        this.read_command()
      when 'entries'
        this.opts_command()
      when 'series'
        this.opts_command()
      when 'stats'
        this.command()
      when 'distribution'
        this.command()
      when 'properties'
        this.command()
      when 'version'
        this.command()
      when 'draw'
        this.opts_command()
      when 'histogram'
        this.command()
      when 'headline'
        this.opts_command()
      when 'trend'
        this.opts_command()
      when 'watch'
        this.watch_command()
      else
        this.help(1, true)

  process_options: () ->
    this.process_option(opt) for opt in @options

  process_option: (opt) ->
    switch opt
      when 'h'
        this.help()
      when 'v'
        @log_level = 'info'
      when 'vv'
        @log_level = 'debug'
      when 'V'
        this.version()
      when ''
        @read_mode = true
      when'j'
        @json_mode = true

  error: (err) ->
    process.stderr.write('Error: ' + err)
    process.stderr.write("\n")

  success: (data) ->
    if @json_mode
      process.stdout.write(JSON.stringify(data))
      process.stdout.write("\n")
    else
      console.log(data)

  command: () ->
    this.connection()[@cmd] @timeseries, @args..., (err, data) =>
      if err
        this.error(err)
      else
        this.success(data)

  opts_command: () ->
    @args = [@cmd_opts]
    this.command()

  read_command: () ->
    if @read_mode
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      buffer = ''
      process.stdin.on 'data', (chunk) =>
        buffer += chunk
      process.stdin.on 'end', () =>
        try
          this.json_command(JSON.parse(buffer))
        catch e
          throw this.error(e)

    else
      this.command()

  json_command: (data) ->
    if Array.isArray(data)
      if Array.isArray(data[0])
        i = 0
        run_next = () =>
          this.json_command(data[i])
          i++
          if i < data.length
            setTimeout(run_next, 500)
        run_next()
      else
        @args = [data[1], data[0], data[2]] ## careful - time and number are the other way around in the output than in the args to connection.insert|remove
        this.command()
    else
      throw "can't deal with json input that looks like that"

  watch_command: () ->
    this.connection().subscribe @timeseries, @args..., (version, stats) =>
      this.success([version, stats])

  logger: () ->
    @lgr ||= if @log_level
               null
             else
               null

  connection: () ->
    @conn ||= new Connection(this.logger())

  version: () ->
    sys.puts "#{@script} v#{CLI.VERSION}"
    process.exit()

  help: (status, short) ->
    console.log '$ numerics [-h -v[v] -j ] [<timeseries>] [<metric>[<suffix>]/<timespan>] <command> [<arg1> ...] [<command options>]'
    unless short
      console.log '''
                       Commands:
                         list                                        list your timeseries (no <timeseries> arg in this case)
                         insert [<number>] [<time>] [<properties>]   insert a value into the timeseries -- args can be ommited, a missing number means 1, a missing times means now
                         remove [<number>] [<time>] [<properties>]   remove -- args can only be ommited if the default would match what needs to be removed
                         about                                       show metadata for a timeseries
                         create [<number>]                           create a new empty timeseries - only really necessary if you want to specify a specific precision with <number>, otherwise they are auto-created on insert
                         erase                                       remove all data from a timeseries and erase its metadata
                         describe [--d <description>] [--u <units>]   set a description and the units for the timeseries -- used in the dashboard/UI
                         stats                                       show accumulated stats for timeseries
                         properties                                  list the properties used in a timeseries
                         version                                     show the current version of the timeseries (<num of inserts>.<num of removals>)
                         entries [time or index options]             show time, number, properties values for the raw timeseries
                         series [time or index options]              separate time and number series for the raw timeseries
                         distribution [<bin_width>] [<first_bin_start>]  show distribution of values in the timeseries
                         draw  [time or index options]               draw an ascii timeseries (on derived timeseries only - will use the default derivation if no derivation specified)
                         histogram  [<bin_width>] [<first_bin_start>]    draw an ascii histogram of the distribution
                         headline [--t[imespan] <timespan>] [--m[etric] <metric>] [--b[efore] <time>]]  give the headline value for a timeseries = the value of <metric> over the last <timespan> (uses metric and timespan from default derivation if none given) before <time> or now
                         trend  [time or index options]              calculate a linear regression trend over the specified period (on derived timeseries only - will use the default derivation if no derivation specified)
                         watch <event>                               watch for <event> changes

                         <metric>[<suffix>]/<timespan>               derive a normalized timeseries = one entry for every <timespan> of the original series, with multiple entries being aggregated according to <metric>
                          <metric> values:  mean, total, count, median, etc@@
                          <suffix> values: +, - or % => + indicates a cumulative aggregation, - a step-wise difference, % the percentage drift from stating datum
                          <timespan> values:  day, minute, second, month, year @@@etc or 7day, 40minute etc

                       Command options:
                        time/index options:
                         --from   start time
                         --to     end time @@inclusive @@???
                         --start  start index (can be negative to count from end)
                         --end    end index @@inclusive @@??? (can be negative to count from end)
                         --limit  max mumber of entries to return
                        examples:
                          --limit 10 => the last 10 entries
                          --from "2011-01-01" --to "2011-02-01" => all entries in Jan 2011 @@inclusive? fix
                          --to yesterday --limit 10 => the last 10 entries before yesterday @@ todo
                          --start 0 --end 100 => the first @@@101 (fix inclusive??) entries
                          --start -10 => the last 10@@check entries

                        Value options:
                         @@todo

                       Events:
                        stats   emits the version data and stats whenever the stats change

                       General options:
                         -h                                      JSON output
                         -h                                      display this and exit
                         -v(v)                                   (extra) verbose logging
                         -V                                      print version and exit

               '''
    process.stdout.flush =>
      status = 1 unless stats?
      process.exit status


exports.CLI = CLI
