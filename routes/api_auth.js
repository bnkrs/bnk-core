var express = require('express');
var router = express.Router();

var auth = require('../lib/auth');

var tokenExpireSec = 24 * 60 * 60;

/**
 * @api {post} /auth/getToken Request an api-token
 * @apiName GetToken
 * @apiGroup Auth
 *
 * @apiParam {String} username Username
 * @apiParam {String} password Password
 *
 * @apiSuccess {String} token The requested token.
 * @apiSuccess {Number} validFor How long the token is valid (in ms)
 * @apiSuccessExample Success-Response
 *     HTTP/1.1 200 OK
 *     {
 *       "token": "ey [...] es0-1Qw",
 *       "validFor": 86400000
 *     }
 *
 * @apiError UsernamePasswordMissing Either username or password wasn't provided
 * @apiErrorExample UsernamePasswordMissing
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "UsernamePasswordMissing"
 *       }
 *     }
 *
 * @apiError UsernamePasswordWrong Username and password don't match
 * @apiErrorExample UsernamePasswordWrong
 *     HTTP/1.1 401 Not Authorized
 *     {
 *       "error": {
 *         "code": 401,
 *         "message": "UsernamePasswordWrong"
 *       }
 *     }
 */
router.post('/getToken', function(req, res, next) {
  if (!req.body.username || !req.body.password) {
    var err = new Error('UsernamePasswordMissing');
    err.status = 400;
    next(err);
  } else {
    auth.checkPasswordByUsername(req.body.username, req.body.password, (err, valid, user) => {
      if (err) {
        return next(err);
      } else if (!valid || !user) {
        // Username or password wrong
        var err = new Error('UsernamePasswordWrong');
        err.status = 401;
        return next(err);
      } else {
        auth.issueJWT(user._id, tokenExpireSec, function (err, token) {
          if (err) {
            return next(err);
          } else {
            res.json({
              token: token,
              validFor: tokenExpireSec * 1000
            });
          }
        });
      }
    });
  }
});

module.exports = router;
