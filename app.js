'use strict';

var pkg = require('./package.json');
var config = require('./config');

var express = require('express');
var path = require('path');
var bunyan = require('bunyan');
var bodyParser = require('body-parser');

// Load everything generic
var generic = require('./lib/generic');

// Prevent nosql-attacks
var content_filter = require('content-filter');

var log = bunyan.createLogger({name: pkg.name});

var db = require('./db/' + config.db);
db.connect(config[config.db], function(err) {
  if (err) {
    log.error("Error while connecting to the database.", err);
    process.exit(1);
  } else {
    log.info("Connection to database established successfully.");
  }
});

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(content_filter());

var api = require('./routes/api');
app.use('/', api);
var api_auth = require('./routes/api_auth');
app.use('/auth', api_auth);
var api_user = require('./routes/api_user');
app.use('/user', api_user);
var api_admin = require('./routes/api_admin');
app.use('/admin', api_admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  log.warn(pkg.name, "running in development-mode, therefore providing stack traces to the client!");
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      error: {
        code: err.status || 500,
        message: err.message,
        stack: err.stack
      }
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
    res.json({
      error: {
        code: err.status || 500,
        message: err.message
      }
    });
});


module.exports = app;
