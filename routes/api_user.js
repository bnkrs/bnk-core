var express = require('express');
var router = express.Router();

var user = require('../lib/user');
var auth = require('../lib/auth');

/**
 * @apiDefine Login
 *
 * @apiParam {String} token API-token
 *
 * @apiError NoTokenProvided No token was given (via <code>Query</code> / <code>Body</code>)
 * @apiErrorExample NoTokenProvided
 *     HTTP/1.1 401 Not Authorized
 *     {
 *       "error": {
 *         "code": 401,
 *         "message": "NoTokenProvided"
 *       }
 *     }
 *
 * @apiError NotAuthenticated The provided token is invalid or expired.
 * @apiErrorExample NotAuthenticated
 *     HTTP/1.1 401 Not Authorized
 *     {
 *       "error": {
 *         "code": 401,
 *         "message": "NotAuthenticated"
 *       }
 *     }
 *
 * @apiError UserNotFound The user to which the session belongs can't be found.
 * @apiErrorExample UserNotFound
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": {
 *         "code": 500,
 *         "message": "UserNotFound"
 *       }
 *     }
 */

/**
 * @api {post} /user/new Create a new User-Account
 * @apiName New
 * @apiGroup User
 *
 * @apiParam {String} username Username
 * @apiParam {String} password Password
 * @apiParam {String} recoveryMethod Preferred recovery-method: <code>phrase</code> / <code>email</code>
 * @apiParam {String} [email] Nescessary if recovery-method is <code>email</code>
 *
 * @apiSuccess {Boolean} success Whether the account-creation was successful.
 * @apiSuccess {String} [phrase] If chosen, the recovery-phrase.
 * @apiSuccessExample Success-Response: E-Mail recovery
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true
 *     }
 * @apiSuccessExample Success-Response: Word-phrase recovery
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "phrase": ["animal", "dad", "wildness", "...", "monster"]
 *     }
 *
 * @apiError UserExists An account with this username already exists
 * @apiErrorExample UserExists
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "UserExists"
 *       }
 *     }
 *
 * @apiError PasswordTooWeak Password doesn't meet expectations
 * @apiErrorExample PasswordTooWeak
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "PasswordTooWeak"
 *       }
 *     }
 *
 * @apiError RecoveryMethodInvalid The provided recovery-method is not known
 * @apiErrorExample RecoveryMethodInvalid
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "RecoveryMethodInvalid"
 *       }
 *     }
 *
 * @apiError EmailMissingInvalid E-Mail adress is missing or invalid (if email-based recovery is chosen)
 * @apiErrorExample EmailMissingInvalid
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "EmailMissingInvalid"
 *       }
 *     }
 */
router.post('/new', function(req, res, next) {
  var b = req.body;
  if (!b.username || !b.password || !b.recoveryMethod) {
    var err = new Error('FieldsMissing');
    err.status = 400;
    next(err);
  } else
    user.new(b.username, b.password, b.recoveryMethod, b.email, function (err, success, phrase) {
      if (err) next(err);
      else if (!phrase) res.json({success: success});
      else res.json({success: success, phrase: phrase })
    });
});

/**
 * @api {get} /user/settings Get the users current settings
 * @apiName SettingsGet
 * @apiGroup User
 *
 * @apiUse Login
 *
 * @apiSuccess {Boolean} transactionLogging Whether transaction-data should be logged.
 * @apiSuccess {String} recoveryMethod Recover-method to use (<code>email</code> / <code>phrase</code>)
 * @apiSuccess {String} [email] E-Mail Adress used for recovery
 *
 * @apiSuccessExample Success-Response
 *     HTTP/1.1 200 OK
 *     {
 *       "transactionLogging": true,
 *       "recoveryMethod": "email",
 *       "email": "your.mail@provider.tld"
 *     }
 */
router.get('/settings', auth.requireAuthenticated, function(req, res, next) {
  user.getSettings(req.user, function(err, settings) {
    if (err) return next(err);
    res.json(settings);
  });
});

/**
 * @api {post} /user/settings Set user-settings
 * @apiName SettingsPost
 * @apiGroup User
 *
 * @apiUse Login
 *
 * @apiParam {Boolean} transactionLogging Whether transaction-data should be logged.
 * @apiParam {String} recoveryMethod 
 *
 * @apiSuccess {Boolean} success If the settings were saved successfully.
 * @apiSuccess {String} [phrase] If the recovery-method was changed to <code>phrase</code>, provide the user with a new recovery phrase.
 * @apiSuccessExample Success-Response: Switched recovery from "email" to "phrase"
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "phrase": ["animal", "dad", "wildness", "...", "monster"]
 *     }
 *
 * @apiSuccessExample Success-Response
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true
 *     }
 *
 * @apiError InvalidSettings Settings are invalid / unknown keys given. Errors are in key <code>errors</code>.
 * @apiErrorExample InvalidSettings
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "errors": ["error_1", "error_2"]
 *     }
 */
router.post('/settings', auth.requireAuthenticated, function(req, res, next) {
  user.applySettings(req.user, req.body, function (err, success, phrase) {
    if (err) next(err);
    else if (!phrase) res.json({success: success});
    else res.json({success: success, phrase: phrase})
  });
})

module.exports = router;
