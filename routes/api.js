var pkg = require('../package.json');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({ 
    app: pkg.name, 
    version: pkg.version,
  });
});

module.exports = router;
