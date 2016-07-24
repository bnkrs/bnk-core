var pkg = require('../package.json');
var cfg = require('../config');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({
    app: pkg.name,
    version: pkg.version,
    config: {
      zxcvbn_minScore: cfg.zxcvbn_minScore
    }
  });
});

module.exports = router;
