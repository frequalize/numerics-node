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

    if !@timeseries?
      this.help(1)

    @cmd = @args.shift()

    if @cmd? && @cmd.match(/\//)
      @timeseries = ['derivation', @timeseries, @cmd] # cmd is really a derivation spec
      @cmd = @args.shift()

    switch @cmd
      when 'insert'
        this.read_command()
      when 'remove'
        this.read_command()
      when 'slice'
        this.command()
      when 'range'
        this.command()
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
      when 'watch'
        this.watch_command()
      when null
        this.help(1) ##@@ pick a default
      else
        this.help(1)

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
    process.stderr.write(err)
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
        this.json_command(d) for d in data
      else
        @args = [data[1], data[0], data[2]] ## careful - time and number are the other way around in the output than in the args to connection.insert|remove
        this.command()
    else
      throw "can't deal with json input that looks like that"

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

  help: (status) ->
    sys.puts '''$ numerics [-h -v[v] -j ] <timeseries> [<aggregate>/<timespan>] <command> [<arg1> ...] [<command options>]

                       Commands:
                         list                                        list your timeseries
                         insert [<number>] [<time>] [<properties>]   insert a value into the timeseries -- args can be ommited, a missing number means 1, a missing times means now
                         remove [<number>] [<time>] [<properties>]   remove -- args can only be ommited if the default would match what needs to be removed
                         stats                                       show accumulated stats for timeseries
                         properties                                  list the properties used in a timeseries
                         version                                     show the current version of the timeseries (<num of inserts>.<num of removals>)
                         slice [<start_time>] [<end_time>]           show times, number, properties values
                         range [<start_index>] [<end_index>]         show times, number, properties values
                         distribution [<bin_width>]                  show distribution of values in the timeseries
                         draw  [time or index options]               draw an ascii timeseries (on derived timeseries only)
                         histogram  [<bin_width>] [value options @@todo]    draw an ascii histogram of the distribution

                       Args:
                        <aggregate>/<timespan>                       derive a normalized timeseries = one entry for every <timespan> of the original series, with multiple entries being aggregayed according to <aggregate>
                          <aggregate> values:  mean, total, @@etc or mean+, total+, etc = the + suffix indicates a cumulative aggregation
                          <timespace> values:  day, minute, second, month, year @@@etc

                       Command options:
                         --from   start time (when applies to a timeseries) or start value (when applied to a distribution)
                         --to     end time (when applies to a timeseries) or end value (when applied to a distribution)
                         --start  start index
                         --end    end index
                         --limit  limit - only valid if one of the start or end or both options are ommited

                       General options:
                         -h                                      JSON output
                         -h                                      display this and exit
                         -v(v)                                   (extra) verbose logging
                         -V                                      print version and exit


             '''
    status = 1 unless stats?
    process.exit status


exports.CLI = CLI
