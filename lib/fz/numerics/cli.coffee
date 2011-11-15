fs   = require 'fs'
path = require 'path'

Connection = (require 'fz/numerics/connection').Connection

# Fz.Numerics.CLI
class CLI

  @VERSION = '0.8'

  constructor : (@config_dir='./.numerics') ->
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

    this.configure()

    this.run()

  configure: () ->
    @key_files = {}
    for f in fs.readdirSync(@config_dir)
      if md = f.match(/(.+)?\.json$/)
        @key_files[md[1]] = f

    current_key_file = path.join(@config_dir, 'current_key')
    if path.existsSync(current_key_file)
      this.set_key(fs.readFileSync(current_key_file))

  keys: () ->
    (JSON.parse(fs.readFileSync(path.join(@config_dir, f))) for k, f of @key_files)

  projects: () ->
    ps = []
    for k in this.keys()
      pn = k.project.name
      ps.push(pn) unless ps.indexOf(pn) > -1
    ps

  list_keys: () ->
    console.log this.keys()

  current_key: () ->
    if @key
      console.log @key

  set_key: (akk, write_file) ->
    if kf = @key_files[akk]
      @key = JSON.parse(fs.readFileSync(path.join(@config_dir, kf)))
      if write_file
        fs.writeFileSync(path.join(@config_dir, 'current_key'), @key.key)

  list_projects: () ->
    console.log this.projects()

  current_project: () ->
    if @key
      console.log @key.project

  set_project: (prj) ->
    picked_key = null
    for k in this.keys()
      if (('' + k.project.id) == prj or k.project.name == prj) && k.permissions == 'rwm'
        picked_key = k
        break
    if picked_key
      this.set_key(picked_key.key, true)
    else
      console.error "No key with rwm permissions for project #{prj} -- use key command instead"

  run: () ->
    this.process_options()

    @timeseries = @args.shift()
    @cmd = @args.shift()

    if {list: true, keys: true, projects: true, help: true}[@timeseries] and !@cmd?
      @cmd = @timeseries
      @timeseries = null
    else if {key: true, project: true}[@timeseries]
      @internal_arg = @cmd
      @cmd = @timeseries
      @timeseries = null

    if @cmd? && @cmd.match(/\//)
      @timeseries = [@timeseries, @cmd] # cmd is really a derivation spec
      @cmd = @args.shift()

    if @timeseries? && !@cmd?
      @cmd = 'about' ## default

    switch @cmd
      when 'keys'
        this.list_keys()
      when 'key'
        if @internal_arg
          this.set_key(@internal_arg, true)
        else
          this.current_key()
      when 'projects'
        this.list_projects()
      when 'project'
        if @internal_arg
          this.set_project(@internal_arg)
        else
          this.current_project()
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
      when 'help'
        this.help()
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
      when't'
        @throttle = true

  error: (err) ->
    console.error('Error: ' + err)
    process.exit(1)

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
            if @throttle
              setTimeout(run_next, 500)
            else
              run_next()
        run_next()
      else
        @args = [data[1], data[0], data[2]] ## careful - time and number are the other way around in the output than in the args to connection.insert|remove
        this.command()
    else
      throw "can't deal with json input that looks like that"

  watch_command: () ->
    if @args.length > 0
      this.connection().subscribe @timeseries, @args..., (data) =>
        this.success(data)
    else
      this.help(1, true)

  ##@@ TODO
  logger: () ->
    @lgr ||= if @log_level
               null
             else
               null

  connection: () ->
    if !@key?
      this.error("No key or project set")
    @conn ||= new Connection(@key.key, @key.secret_key, @key.host, @key.port)

  version: () ->
    console.log "#{@script.match(/.*\/(.+?)$/)[1]} v#{CLI.VERSION}"
    process.exit()

  help: (status, short) ->
    text = [
      ' $ numerics [switches] [<timeseries>] [<metric>[<suffix>]/<timespan>] <command> [args...] [<command options>]',
      '',
      '  Commands:',
      '',
      '    list                                        list your timeseries (no <timeseries> arg in this case)',
      '    about                                       show metadata for a timeseries',
      '',
      '    insert [<number>] [<time>] [<properties>]   insert a value into the timeseries -- args can be ommited, a missing number means 1, a missing times means now',
      '    remove [<number>] [<time>] [<properties>]   remove -- args can only be ommited if the default would match what needs to be removed',
      '    create [<number>]                           create a new empty timeseries - only necessary if you want to specify a specific precision (<number>)',
      '                                                  otherwise timeseries are auto-created on insert',
      '    erase                                       remove all data from a timeseries and erase its metadata',
      '    describe [--d <description>] [--u <units>]  set a description and the units for the timeseries -- used in the dashboard/UI',
      '',
      '    stats                                       show accumulated stats for timeseries',
      '    properties                                  list the properties used in a timeseries',
      '    version                                     show the current version data for the timeseries',
      '',
      '    entries [time/index options]                show time, number, properties values for the raw timeseries',
      '    series [time/index options]                 separate time and number series for the raw timeseries',
      ''
      '    distribution [<bin_width>] [<first_bin_start>]  show distribution of values in the timeseries',
      '    headline [--t <timespan>] [--m <metric>] [--b <time>]]  give the headline value for a timeseries = the value of <metric> over the last <timespan>',
      '                                                              before <time> or now - uses metric and timespan from default derivation if none given',
      '    trend  [time/index options]                 calculate a linear regression trend over the specified period (derived timeseries only - will use the',
      '                                                  default derivation if no derivation specified)',
      '    watch <event>                               watch for <event> changes',
      '',
      '    draw  [time or index options]               draw an ascii timeseries (derived timeseries only - default derivation used if no derivation specified)',
      '    histogram  [<bin_width>] [<first_bin_start>]    draw an ascii histogram of the distribution',
      '',
      '  Derived timeseries:',
      '',
      '    <metric>[<suffix>]/<timespan>               derive a normalized timeseries = one entry for every <timespan> of the original series, with multiple entries being aggregated according to <metric>',
      '      metric values:                            mean, total, count, median, etc@@',
      '      suffix values:                            +, - or %  (+ indicates a cumulative aggregation, - a step-wise difference, % the percentage drift from stating datum)',
      '      timespan values:                          day, minute, second, month, year @@@etc or 7day, 40minute, etc',
      '',
      '  Command options:',
      '',
      '    time/index options:',
      '      --from                                    start time',
      '      --to                                      end time @@inclusive @@???',
      '      --start                                   start index (can be negative to count from end)',
      '      --end                                     end index @@inclusive @@??? (can be negative to count from end)',
      '      --limit                                   max mumber of entries to return',
      '    examples:',
      '      --limit 10                                the last 10 entries',
      '      --from "2011-01-01" --to "2011-02-01"     all entries in Jan 2011 @@inclusive? fix',
      '      --to yesterday --limit 10                 the last 10 entries before yesterday @@ todo',
      '      --start 0 --end 100                       the first @@@101 (fix inclusive??) entries',
      '      --start -10                               the last 10@@check entries',
      '',
      '    events:',
      '      version   emits the version data whenever an entry is added or removed',
      '',
      '  Switches:',
      '',
      '    -h                                          display this and exit',
      '    -V                                          print version and exit',
      '    -v(v)                                       (extra) verbose logging',
      '    -                                           read the args for the command from stdin - piping in a JSON array of arrays allows multiple calls',
      '    -t                                          throttle requests (2 per second) when reading args from stdin',
      '    -j                                          JSON output @@??##todo',
      ''
    ]

    if short
      console.log text[0]
    else
      console.log text.join("\n")

    status = 1 unless status?
    process.exit status

exports.CLI = CLI
