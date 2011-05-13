http = require 'http'

# Fz.Numerics.Connection
class Connection

  @HOST : '127.0.0.1'
  @PORT : 3006
  @QUERY_OPTIONS : {
    host: @HOST
    port: @PORT
    method: 'POST'
    path: '/query'
  }

  constructor : () ->

  insert: (timeseries, args..., callback) ->
    this.query(['insert', timeseries, this.parse_write_args(args)...], false, callback) ##@@ support keepalive

  remove: (timeseries, args..., callback) ->
    this.query(['remove', timeseries, this.parse_write_args(args)...], false, callback) ##@@ support keepalive

  slice: (timeseries, args..., callback) ->
    this.query(['slice', timeseries, this.parse_time_args(args)...], false, callback)

  range: (timeseries, args..., callback) ->
    this.query(['range', timeseries, this.parse_number_args(args)...], false, callback)

  stats: (timeseries, args..., callback) ->
    this.query(['stats', timeseries, args...], false, callback)

  properties: (timeseries, callback) ->
    this.query(['properties', timeseries], false, callback)

  version: (timeseries, callback) ->
    this.query(['version', timeseries], false, callback)

  parse_time_args: (args) ->
    [number_args, word_args, time_args, json_args] = this.split_args(args)
    (['time', '' + arg] for arg in number_args).concat(['time', '' + arg] for arg in time_args)

  parse_number_args: (args) ->
    [number_args, word_args, time_args, json_args] = this.split_args(args)
    ['number', '' + arg] for arg in number_args

  parse_write_args: (args) ->
    now = new Date()  ## for consistency among the ways to default to now

    [number_args, word_args, time_args, json_args] = this.split_args(args)

    if 0 == number_args.length
      number = '1'
    else if 1 == number_args.length
      number = number_args[0]
    else if 2 == number_args.length
      number = number_args[0]
      time = number_args[1]
    else
      throw "bad number of number-like args" ##@@ better errors here

    if 1 == word_args.length
      candidate_time = switch word_args[0]
                         when 'now'  ## support more
                           now
                         else
                           null
      if candidate_time?
        if  time?
          throw "time found too many times"
        else
          time = candidate_time
    else if word_args.length > 1
      throw "bad number of word-like args" ##@@ better errors here


    if 1 == time_args.length
      if  time?
        throw "time found too many times"
      else
        time = time_args[0]
    else if time_args.length > 1
      throw "bad number of time-like args" ##@@ better errors here

    if 1 == json_args.length
      properties = json_args[0]
    else if json_args.length > 1
      throw "bad number of json-like args" ##@@ better errors here


    if !time?
      time = now ## @@serialise date

    parsed_args = [['time', time], ['number', number]]

    if properties?
      try
        parsed_args.push(['json', JSON.parse(properties)])
      catch e
        throw "bad json arg: #{properties} : #{e}"

    console.log parsed_args

    parsed_args

  split_args: (args) ->
    number_args = []
    word_args = []
    time_args = []
    json_args = []
    for arg in args
      sarg = '' + arg
      if sarg.match(/^-?\d+(?:\.\d+)?$/)
        number_args.push sarg
      else if sarg.match(/^[0-9a-z_\- ]+$/i)
        word_args.push sarg
      else if sarg.match(/^[0-9\-+: ]+$/) ##@@ support more formats here
        time_args.push sarg
      else if '{' == sarg[0]
        json_args.push sarg
      else
        throw "bad arg: #{sarg}" ##@@ better errors here
    [number_args, word_args, time_args, json_args]


  query: (query, keep_alive, callback) ->
    console.log query
    request = http.request Connection.QUERY_OPTIONS, (response) =>
      err = null
      data = null
      done = -> callback(err, data) if callback

      body = ''
      response.on 'data', (chunk) =>
        body += chunk
      response.on 'end', () =>
        try
          [err, data] = [JSON.parse(body)...]
        catch e
          err = 'invalid server response'
        done()

    request.setHeader('Transfer-Encoding', 'normal')
    request.setHeader('Content-Type', 'application/json')
    if keep_alive
      request.setHeader('Connection', 'Keep-Alive')
    else
      request.setHeader('Connection', 'Close')
    request.write(JSON.stringify(query))
    request.end()


exports.Connection = Connection
