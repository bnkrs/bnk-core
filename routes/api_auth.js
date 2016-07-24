var express = require('express');
var router = express.Router();

var auth = require('../lib/auth');
var user = require('../lib/user');

var tokenExpireSec = 30 * 60;

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
router.post('/getToken', (req, res, next) => {
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
        auth.issueJWT(user, tokenExpireSec, function (err, token) {
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

/**
 * @api {post} /auth/revoke_tokens Revoke all Tokens
 * @apiName RevokeTokens
 * @apiGroup Auth
 *
 * @apiUse Login
 *
 * @apiSuccess {Boolean} success Whether the revocation of all issued was successfull
 *
 * @apiSuccessExample Success-Response
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true
 *     }
 */
router.post('/revoke_tokens', auth.requireAuthenticated, (req, res, next) => {
  user.updateRevocationString(req.user, (err) => {
    if (err) {
      return next(err);
    } else {
      res.json({
        success: true
      });
    }
  });
});

module.exports = router;
