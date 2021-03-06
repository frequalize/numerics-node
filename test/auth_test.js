(function() {
  var Numerics, all, assert, test_invalid, test_json, test_json_env, test_object;

  assert = require('assert');

  Numerics = require('numerics').Numerics;

  test_json = function() {
    var conn;
    conn = Numerics.connect('test/assets/auth.json');
    assert.equal(conn.access_key, 'blah');
    return assert.equal(conn.secret_key, 'moreblah');
  };

  test_json_env = function() {
    var conn;
    var _this = this;
    conn = Numerics.connect('test/assets/auth_env.json', 'production');
    assert.equal(conn.access_key, 'blah');
    assert.equal(conn.secret_key, 'moreblah');
    conn = Numerics.connect('test/assets/auth_env.json', 'development');
    assert.equal(conn.access_key, 'foo');
    assert.equal(conn.secret_key, 'foobar');
    assert.throws(function() {
      return Numerics.connect('test/assets/auth_env.json', 'test');
    });
    return assert.throws(function() {
      return Numerics.connect('test/assets/missing.json');
    });
  };

  test_object = function() {
    var conn;
    conn = Numerics.connect({
      access_key: 'blah',
      secret_key: 'moreblah'
    });
    assert.equal(conn.access_key, 'blah');
    return assert.equal(conn.secret_key, 'moreblah');
  };

  test_invalid = function() {
    var conn;
    var _this = this;
    conn = Numerics.connect({
      access_key: 'invalid',
      secret_key: 'notsecret'
    });
    return conn.list(function(err, data) {
      assert.ok(err);
      return assert.ok(err.match(/no such access/));
    });
  };

  all = function() {
    test_json();
    test_json_env();
    test_object();
    return test_invalid();
  };

  all();

}).call(this);
