# numerics.io API client for Node.js

A Node.js client and command line interface for the [numerics.io](https://numerics.io/) metrics API. (The API service is currently in private alpha.)

See also numerics-ruby.

## Install

    $ npm install numerics

or if you want the "numerics" command available globlly

    $ npm install numerics -g

Then:

    $ node_modules/numerics/bin/numerics help

or

    $ numerics help

## API Summary

    var Numerics = require('numerics');
    
    var connection = Numerics.connect({access_key: "project_access_key", secret_key: "project_secret_key"});
    // or using a config file
    var connection = Numerics.connect('path/to/config.json');
    // or using a config file with multiple enviroment-specific configs in it
    var connection = Numerics.connect('path/to/config.json', 'production');

    //list variables in project
    connection.list(function(err, data) {
      console.log(data) // => []
    });

    //start inserting data
    connection.insert('invites_sent', 3, new Date(), {user_id: 1234}, function(err, data) {
      console.log(data) // => { 'insertions' : 1, 'removals' : 0, 'number' : 1, 'stamp' : '1.0' }
    });


## CLI Summary

### Authentication

In any directory where you ant to be able to run the "numerics" command, create a sub-directory named ".numerics". Copy the admin access key .json files from you Numerics projects into ".numerics".

To see what keys are available in your .numerics dir:

    $ numerics keys

To set the key to use:

    $ numerics key GMJHUBDGINZRXJZBHMYCTNEJ

This commands would set numerics to use the credentials given in .numerics/GMJHUBDGINZRXJZBHMYCTNEJ.json

To see the key currently being used:

    $ numerics key

### Commands

To list the varaibles currently being tracked in the project for the key:

    $ numerics list

To insert a new measurement:

    $ numerics some_variable_name insert 3

Would insert the value 3, using the current time as timestamp, into the variable some_variable_name

To view the timeseries for some_variable_name:

    $ numerics some_variable_name entries

To view a chart of total per hour for some_variable_name measurements

    $ numerics some_variable_name total/hour draw

All commands documented under:

    $ numerics help


## Useful for

  * Measuring Anything
  * Monitoring business processes
  * ...
