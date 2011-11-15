assert = require 'assert'

Numerics = require('fz/numerics').Numerics

test_json = () ->
  conn = Numerics.connect('test/assets/auth.json')
  assert.equal conn.access_key, 'blah'
  assert.equal conn.secret_key, 'moreblah'

test_json_env = () ->
  conn = Numerics.connect('test/assets/auth_env.json', 'production')
  assert.equal conn.access_key, 'blah'
  assert.equal conn.secret_key, 'moreblah'

  conn = Numerics.connect('test/assets/auth_env.json', 'development')
  assert.equal conn.access_key, 'foo'
  assert.equal conn.secret_key, 'foobar'

  assert.throws () =>
    Numerics.connect('test/assets/auth_env.json', 'test')

  assert.throws () =>
    Numerics.connect('test/assets/missing.json')

test_object = () ->
  conn = Numerics.connect({access_key: 'blah', secret_key: 'moreblah'})
  assert.equal conn.access_key, 'blah'
  assert.equal conn.secret_key, 'moreblah'

test_invalid = () ->
  conn = Numerics.connect({access_key: 'invalid', secret_key: 'notsecret'})
  conn.list (err, data) =>
    assert.ok err
    assert.ok err.match(/no such access/)


all = () ->
  test_json()
  test_json_env()
  test_object()
  test_invalid()


all()