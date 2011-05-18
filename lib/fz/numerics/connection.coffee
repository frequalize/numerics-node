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

  ## Commands ##

  insert: (timeseries, args..., callback) ->
    this.query(['insert', timeseries, this.write_args(args)...], false, callback) ##@@ support keepalive

  remove: (timeseries, args..., callback) ->
    this.query(['remove', timeseries, this.write_args(args)...], false, callback) ##@@ support keepalive

  slice: (timeseries, args..., callback) ->
    this.query(['slice', timeseries, this.time_args(args)...], false, callback)

  range: (timeseries, args..., callback) ->
    this.query(['range', timeseries, this.number_args(args)...], false, callback)

  stats: (timeseries, args..., callback) ->
    this.query(['stats', timeseries, args...], false, callback)

  distribution: (timeseries, args..., callback) ->
    this.query(['distribution', timeseries, this.number_args(args)...], false, callback) ##@@ other args

  properties: (timeseries, callback) ->
    this.query(['properties', timeseries], false, callback)

  version: (timeseries, callback) ->
    this.query(['version', timeseries], false, callback)

  draw: (timeseries, args..., callback) ->
    this.query(['draw', timeseries, args...], false, callback)

  histogram: (timeseries, args..., callback) ->
    this.query(['histogram', timeseries, this.number_args(args)...], false, callback)

  ## Args ##

  time_args: (args) ->
    ['time', '' + arg] for arg in args

  number_args: (args) ->
    ['number', '' + arg] for arg in args

  write_args: (args) ->
    now = new Date().toString()

    if 0 == args.length
      number = '1'
      time = now

    else if 1 == args.length
      if this.is_numeric(args[0])
        number = '' + args[0]
        time = now
      else if this.is_jsonic(args[0])
        number = '1'
        time = now
        properties = args[0]
      else
        number = '1'
        time = args[0]

    else if 2 == args.length
      if this.is_numeric(args[0])
        number = '' + args[0]
        if this.is_jsonic(args[1])
          time = now
          properties = args[1]
        else
          time = args[1]
      else if this.is_jsonic(args[1])
        number = '1'
        time = args[0]
        properties = args[1]
      else
        throw "unclear args" ##@@ better
    else if 3 == args.length
      number = '' + args[0]
      time = '' + args[1]
      properties = args[2]
    else
      throw "too many args"

    parsed_args = [['time', time], ['number', number]]

    if properties?
      if 'object' == typeof properties
        parsed_args.push(['json', properties])
      else
        try
          parsed_args.push(['json', JSON.parse(properties)])
        catch e
          throw "bad json arg: #{properties} : #{e}"

    parsed_args

  is_numeric: (arg) ->
    ('number' == typeof arg) || ('' + arg).match(/^-?\d+(?:\.\d+)?$/)

  is_jsonic: (arg) ->
    ('object' == typeof arg) || ('{' == arg[0])

  query: (query, keep_alive, callback) ->
    console.log query ##@@ if verbose??
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
