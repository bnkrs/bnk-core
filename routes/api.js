var pkg = require('../package.json');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({ 
    app_name: pkg.name, 
    app_v: pkg.version,
    api_v: pkg.api_version
  });
});

module.exports = router;
