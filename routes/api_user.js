var express = require('express');
var router = express.Router();

var user = require('../lib/user');
var auth = require('../lib/auth');

var generic = require('../lib/generic');
var newError = generic.newError;

/**
 * @apiDefine Login
 *
 * @apiParam {String} token API-token
 *
 * @apiError NoTokenProvided No token was given (via <code>Query</code> / <code>Body</code>)
 * @apiErrorExample NoTokenProvided
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
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
 * @apiError FieldsMissing An account with this username already exists
 * @apiErrorExample FieldsMissing
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "FieldsMissing"
 *       }
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
 *
 * @apiError UsernameInvalid Username contains illegal characters (eg. underscores, spaces)
 * @apiErrorExample UsernameInvalid
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "UsernameInvalid"
 *       }
 *     }
 */
router.post('/new', (req, res, next) => {
  var b = req.body;
  if (!b.username || !b.password || !b.recoveryMethod) {
    next(newError("FieldsMissing", 400));
  } else {
    user.new(b.username, b.password, b.recoveryMethod, b.email, function (err, success, phrase) {
      if (err) {
        next(err);
      } else if (!phrase) {
        res.json({success: success});
      } else {
        res.json({success: success, phrase: phrase });
      }
    });
  }
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
router.get('/settings', auth.requireAuthenticated, (req, res, next) => {
  user.getSettings(req.user, function(err, settings) {
    if (err) {
      return next(err);
    } else {
      res.json(settings);
    }
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
 * @apiParam {String} [email] To change the e-mail (nescessary for recovery method "email")
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
router.post('/settings', auth.requireAuthenticated, (req, res, next) => {
  user.applySettings(req.user, req.body, function (err, success, phrase) {
    if (err) {
      next(err);
    } else if (!phrase) {
      res.json({success: success});
    } else {
      res.json({success: success, phrase: phrase});
    }
  });
});

/**
 * @api {get} /user/balance Get the users current balance
 * @apiName Balance
 * @apiGroup User
 *
 * @apiUse Login
 *
 * @apiSuccess {Number} balance The current user's settings in eurocents.
 * @apiSuccessExample Success-Response
 *     HTTP/1.1 200 OK
 *     {
 *       "balance": 1299
 *     }
 */
router.get('/balance', auth.requireAuthenticated, (req, res, next) => {
  user.balance(req.user, (err, balance) => {
    if (err) {
      next(err);
    } else {
      res.json({ balance: balance });
    }
  });
});

/**
 * @api {get} /user/transactions Get the users transactions
 * @apiName Transactions
 * @apiGroup User
 *
 * @apiUse Login
 *
 * @apiSuccess {Array} transactions
 * @apiSuccess {String} transactions[i].sender Sender username
 * @apiSuccess {String} transactions[i].receiver Receiver username (if terminal-payment prefixed with "terminal_")
 * @apiSuccess {Number} transactions[i].value The transaction value in eurocents
 * @apiSuccess {Number} transcations[i].timestamp Transaction timestamp (Unix in ms)
 *
 * @apiSuccessExample Success-Response Transaction-Logging enabled
 *     HTTP/1.1 200 OK
 *     {
 *       "transactions": [
 *         {
 *           "sender": "alice",
 *           "receiver": "steve",
 *           "value": 275,
 *           "timestamp": 881928732657
 *         },
 *         {
 *           "sender": "jon",
 *           "receiver": "terminal_mainhall",
 *           "value": 170,
 *           "timestamp": 1715369892847
 *         }
 *       ]
 *     }
 * @apiSuccessExample Success-Response Transaction-Logging disabled
 *     HTTP/1.1 200 OK
 *     {
 *       "transactions": []
 *     }
 */
router.get('/transactions', auth.requireAuthenticated, (req, res, next) => {
  user.transactions(req.user, (err, transactions) => {
    if (err) {
      next(err);
    } else {
      res.json({ transactions: transactions });
    }
  });
});

/**
 * @api {post} /user/send Perform a transaction
 * @apiName SendMoney
 * @apiGroup User
 *
 * @apiUse Login
 *
 * @apiParam {String} receiver The user to whom the money is sent
 * @apiParam {Number} value The amount of money in eurocents
 *
 * @apiSuccess {Boolean} success Whether the transaction was successful
 * @apiSuccess {Number} newBalance The balance after the transaction
 *
 * @apiSuccessExample Success-Response
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "newBalance": 4089
 *     }
 *
 * @apiError ReceiverNotFound The receiving user can't be found / Money is being sent to a terminal-account (not possible)
 * @apiErrorExample ReceiverNotFound
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "ReceiverNotFound"
 *       }
 *     }
 *
 * @apiError BalanceInsufficient The sender's account balance is insufficient to perform the transaction.
 * @apiErrorExample BalanceInsufficient
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "BalanceInsufficient"
 *       }
 *     }
 *
 * @apiError BadRequest Fields are missing or the <code>value</code> is not a positive integer
 * @apiErrorExample BadRequest
 *     HTTP/1.1 400 Bad Request
 *     {
 *        "error": {
 *          "code": 400,
 *          "message": "BadRequest"
 *        }
 *      }
 */
router.post("/send", auth.requireAuthenticated, (req, res, next) => {
  user.sendMoney(req.user, req.body.receiver, req.body.value, (err) => {
    if (err) {
      next(err);
    } else {
      user.balance(user, (err, balance) => {
        if (err) {
          next(err);
        } else {
          res.json({
            success: true,
            newBalance: balance
          });
        }
      });
    }
  });
});

/**
 * @api {post} /user/change_password Change the users password
 * @apiName ChangePassword
 * @apiGroup User
 *
 * @apiUse Login
 *
 * @apiParam {String} new_password The new password to set
 * @apiParam {String} old_password The old user-password
 *
 * @apiSuccess {Boolean} success Whether the password-change was successful
 *
 * @apiSuccessExample Success-Response
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true
 *     }
 *
 * @apiError PasswordTooWeak New password doesn't meet expectations
 * @apiErrorExample PasswordTooWeak
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 400,
 *         "message": "PasswordTooWeak"
 *       }
 *     }
 *
 * @apiError PasswordWrong The old password is wrong
 * @apiErrorExample PasswordWrong
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": {
 *         "code": 401,
 *         "message": "PasswordWrong"
 *       }
 *     }
 *
 * @apiError BadRequest Fields are missing
 * @apiErrorExample BadRequest
 *     HTTP/1.1 400 Bad Request
 *     {
 *        "error": {
 *          "code": 400,
 *          "message": "BadRequest"
 *        }
 *      }
 */
router.post('/change_password', auth.requireAuthenticated, (req, res, next) => {
  if (!req.body.old_password || !req.body.new_password) {
    next(newError("BadRequest", 400));
  } else {
    user.changePassword(req.user, req.body.old_password, req.body.new_password, (err) => {
      if (err) {
        next(err);
      } else {
        res.json({success: true});
      }
    });
  }
});

module.exports = router;
