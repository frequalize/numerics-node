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

    for arg in process.argv
      if md = arg.match(/^-([a-z]+)$/i)
        @options.push md[1]
      else
        @args.push arg

    this.run()

  run: () ->

    this.process_options()

    @timeseries = @args.shift()

    if !@timeseries?
      this.help(1)

    @cmd = @args.shift()

    if @cmd.match(/\//)
      @timeseries = ['derivation', @timeseries, @cmd] # cmd is really a derivation spec
      @cmd = @args.shift()

    switch @cmd
      when 'insert'
        this.command()
      when 'remove'
        this.command()
      when 'slice'
        this.command()
      when 'range'
        this.command()
      when 'view'
        this.command()
      when 'stats'
        this.command()
      when 'properties'
        this.command()
      when 'version'
        this.command()
      when 'draw'
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

  command: () ->
    this.connection()[@cmd] @timeseries, @args..., (err, data) =>
      if err
        console.log 'error: ' + err
      else
        console.log data

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
    sys.puts '''$ numerics [-h -v[v] ] <timeseries> [<aggregate>/<timespan>] [ <command> [<arg1> ...] ]

                       Commands:
                         list                                        list your timeseries
                         insert [<number>] [<time>] [<properties>]   insert a value into the timeseries -- args can be ommited, a missing number means 1, a missing times means now
                         remove [<number>] [<time>] [<properties>]   remove -- args can only be ommited if the default would match what needs to be removed
                         stats                                       show accumulated stats for timeseries
                         properties                                  list the properties used in a timeseries
                         version                                     show the current version of the timeseries (<num of inserts>.<num of removals>)
                         slice [<start_time>] [<end_time>]           show times, number, properties values
                         range [<start_index>] [<end_index>]         show times, number, properties values
                         draw  [<start_time>] [<end_time>]           draw an ascii timeseries (on derived timeseries only)

                       Options:
                         -h                                      display this and exit
                         -v(v)                                   (extra) verbose logging
                         -V                                      print version and exit


             '''
    status = 1 unless stats?
    process.exit status


exports.CLI = CLI
