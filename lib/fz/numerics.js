(function() {
  var Connection, fs;
  fs = require('fs');
  Connection = require('fz/numerics/connection').Connection;
  exports.Numerics = {
    Connection: Connection,
    CLI: (require('fz/numerics/cli')).CLI,
    connect: function(arg, env) {
      var access_key, config, secret_key;
      config = 'string' === typeof arg ? JSON.parse(fs.readFileSync(arg)) : arg;
      if (env != null) {
        config = config[env];
        if (!(config != null)) {
          throw "" + env + " not found in " + arg;
        }
      }
      access_key = config.access_key;
      secret_key = config.secret_key;
      if ((access_key != null) && (secret_key != null)) {
        return new Connection(access_key, secret_key);
      } else {
        throw 'Numerics.connect(config_file [, env]) or Numerics.connect(access_key: access_key, secret_key: secret_key)';
      }
    }
  };
}).call(this);
