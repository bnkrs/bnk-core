var pkg = require('../package.json');
var cfg = require('../config');

var express = require('express');
var router = express.Router();

/**
 * @api {get} / API-Information
 * @apiName Info
 * @apiGroup 0
 *
 * @apiSuccess {String} app The name of the backend-app
 * @apiSuccess {String} version The backend-version
 * @apiSuccess {Object} config Various configuration parameters (see Example)
 *
 * @apiSuccessExample Success-Response
 *     HTTP/1.1 200 OK
 *     {
 *       "app": "bnk-core",
 *       "version": "1.5.2-r3",
 *       "config": {
 *         "zxcvbn_minScore": 4
 *       }
 *     }
 */
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
