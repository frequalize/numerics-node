HTTPS = require 'https'
QS   = require('querystring')

SIO = require('socket.io-client')

# Numerics.Connection
class Connection

  @VERSION : '0.8.1'

  @HOST : 'api.numerics.io'
  @PORT : 443
  @BASE_PATH: '/ts'
  @EVENT_RESOURCE: 'event'

  constructor : (@access_key, @secret_key, @host=Connection.HOST, @port=Connection.PORT) ->

  ## Commands ##

  list: (_..., callback) ->
    this.coll_get(callback)

  create: (args..., callback) ->
    this.coll_post(args, callback)

  about: (timeseries, callback) ->
    this.get(timeseries, 'about', callback)

  describe: (timeseries, args..., callback) ->
    this.put(timeseries, 'describe', args..., callback)

  erase: (timeseries, callback) ->
    this.destroy(timeseries, callback)

  insert: (timeseries, args..., callback) ->
    this.post(timeseries, 'insert', this.write_args(args), callback)

  remove: (timeseries, args..., callback) ->
    this.post(timeseries, 'remove', this.write_args(args), callback)

  entries: (timeseries, query, callback) ->
    this.get(timeseries, 'entries', query, callback)

  series: (timeseries, query, callback) ->
    this.get(timeseries, 'series', query, callback)

  stats: (timeseries, args..., callback) ->
    this.get(timeseries, 'stats', args..., callback)

  stats_per: (timeseries, property_name, callback) ->
    this.get(timeseries, 'stats_per', {p: property_name}, callback)

  stats_without_zeros: (timeseries, args..., callback) ->
    this.get(timeseries, 'stats_without_zeros', args..., callback)

  tally_of: (timeseries, args..., callback) ->
    query = {}
    if args.length > 0
      query['v'] = args[0]
    this.get(timeseries, 'tally_of', query, callback)

  distribution: (timeseries, args..., callback) ->
    query = {}
    if args.length > 0
      query['w'] = args[0]
      query['s'] = args[1]
    this.get(timeseries, 'distribution', query, callback)

  properties: (timeseries, callback) ->
    this.get(timeseries, 'properties', callback)

  version: (timeseries, callback) ->
    this.get(timeseries, 'version', callback)

  draw: (timeseries, query, callback) ->
    this.get(timeseries, 'draw', query, callback)

  histogram: (timeseries, args..., callback) ->
    query = {}
    if args.length > 0
      query['w'] = args[0]
      query['s'] = args[1]
    this.get(timeseries, 'histogram', query, callback)

  headline: (timeseries, query, callback) ->
    this.get(timeseries, 'headline', query, callback)

  trend: (timeseries, query, callback) ->
    this.get(timeseries, 'trend', query, callback)

  ## Args Checkers ##

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

    ordered_args = [time, number]

    if properties?
      if 'object' == typeof properties
        ordered_args.push(properties)
      else
        try
          ordered_args.push(JSON.parse(properties))
        catch e
          throw "bad json arg: #{properties} : #{e}"

    ordered_args

  is_numeric: (arg) ->
    ('number' == typeof arg) || ('' + arg).match(/^-?\d+(?:\.\d+)?$/)

  is_jsonic: (arg) ->
    ('object' == typeof arg) || ('{' == arg[0])

  ## end of Arg helpers ##

  coll_get: (callback) ->
    this.send('GET', Connection.BASE_PATH, null, callback)

  coll_post: (args, callback) ->
    this.send('POST', Connection.BASE_PATH, JSON.stringify(args), callback)

  get: (timeseries, command, rest...) ->
    if rest.length == 1
      callback = rest[0]
    else
      query = rest[0]
      callback = rest[1]
    path = [Connection.BASE_PATH, (if Array.isArray(timeseries) then timeseries.join('/') else timeseries), command].join('/')
    if query?
      path += '?' + QS.stringify(query)

    this.send('GET', path, null, callback)

  post: (timeseries, command, args, callback) ->
    this.send('POST', [Connection.BASE_PATH, (if Array.isArray(timeseries) then timeseries.join('/') else timeseries), command].join('/'), JSON.stringify(args), callback)

  put: (timeseries, command, args, callback) ->
    this.send('PUT', [Connection.BASE_PATH, (if Array.isArray(timeseries) then timeseries.join('/') else timeseries), command].join('/'), JSON.stringify(args), callback)

  destroy: (timeseries, callback) ->
    this.send('DELETE', [Connection.BASE_PATH, (if Array.isArray(timeseries) then timeseries.join('/') else timeseries)].join('/'), null, callback)

  send: (method, path, body, callback) ->
    ##@@ if verbose?
    console.log "#{method} #{path}"
    console.log "BODY: #{body}" if body?

    request = HTTPS.request {host: @host, port: @port, method: method, path: path}, (response) =>
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

    request.setHeader('User-Agent', 'numerics-node v' + Connection.VERSION)
    request.setHeader('X-Access-Key', @access_key)
    request.setHeader('X-Secret-Key', @secret_key) ##@@ todo -- only if HTTPS!!!
    if false ##@@ todo - support keep_alive
      request.setHeader('Connection', 'Keep-Alive')
    else
      request.setHeader('Connection', 'Close')
    if body?
      request.setHeader('Transfer-Encoding', 'normal')
      request.setHeader('Content-Type', 'application/json')
      request.setHeader('Content-Length', body.length)
      request.write(body)

    request.end()


  subscribe: (timeseries, events..., callback) ->
    @subscriptions ||= {}
    @subscriptions[timeseries] ||= {}
    for event in events
      @subscriptions[timeseries][event] ||= []
      @subscriptions[timeseries][event].push(callback)

    this.with_ws_client (ws) =>
      ws.emit('message', ['subscribe', timeseries, events])

  ws_client_url: () ->
    url_parts = ['wss:', @host, ':', @port, '?ak=', @access_key]
    ##@@ todo -- only if HTTPS!!
    url_parts.push('&')
    url_parts.push('sk')
    url_parts.push('=')
    url_parts.push(@secret_key)
    url_parts.join('')

  with_ws_client: (callback) ->
    if @ws
      callback(@ws)
    else
      SIO.transports = ['xhr-polling'] ## temp until node web socket implementation supports secure
      this.setup_ws_client(SIO.connect(this.ws_client_url(), {resource: Connection.EVENT_RESOURCE, secure: true}), callback)

  setup_ws_client: (ws, callback) ->
    ws.on 'connect', () =>
      @ws = ws
      callback(ws)
    ws.on 'disconnect', () =>
      console.error 'ws disconnect'
      @ws = null
    ws.on 'message', (msg) =>
      [ts, event, data...] = msg
      if ts && event && @subscriptions[ts] && @subscriptions[ts][event]
        cb(data...) for cb in @subscriptions[ts][event]
      else
        console.error 'invalid server response'
    ws.on 'error', (err) =>
      console.error 'ws error', err

exports.Connection = Connection
