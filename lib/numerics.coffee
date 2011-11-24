fs = require('fs')
Connection = require('./numerics/connection').Connection

# Numerics
exports.Numerics =
  Connection: Connection
  CLI: (require './numerics/cli').CLI

  connect: (arg, env) ->
    config = if 'string' == typeof arg
               JSON.parse(fs.readFileSync(arg))
             else
               arg

    if env?
      config = config[env]
      if !config?
        throw "#{env} not found in #{arg}"

    access_key = config.access_key
    secret_key = config.secret_key

    if access_key? and secret_key?
      new Connection(access_key, secret_key)
    else
      throw 'Numerics.connect(config_file [, env]) or Numerics.connect(access_key: access_key, secret_key: secret_key)'

