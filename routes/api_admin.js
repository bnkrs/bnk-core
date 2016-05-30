var express = require('express');
var router = express.Router();

var auth = require('../lib/auth');
var admin = require('../lib/admin')

var generic = require('../lib/generic');
var newError = generic.newError;

/**
 * @apiDefine AdminLogin
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
 *
 * @apiError NotAdmin The user to which the session belongs can't access admin functions
 * @apiErrorExample NotAdmin
 *     HTTP/1.1 401 Not Authenticated
 *     {
 *       "error": {
 *         "code": 401,
 *         "message": "NotAdmin"
 *       }
 *     }
 */

 /**
  * @api {post} /admin/addMoney Add money to a user-account
  * @apiName AddMoney
  * @apiGroup Admin
  *
  * @apiUse AdminLogin
  *
  * @apiParam {String} receiver The user to whom the money is sent
  * @apiParam {Number} value The amount of money in eurocents
  *
  * @apiSuccess {Boolean} success Whether the transaction was successful
  *
  * @apiSuccessExample Success-Response
  *     HTTP/1.1 200 OK
  *     {
  *       "success": true
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
router.post('/addMoney', auth.requireAdmin, (req, res, next) => {
  if (!req.body.receiver|| !req.body.value)
    next(newError("BadRequest", 400));
  else
    admin.addMoney(req.user.username, req.body.receiver, req.body.value, (err) => {
      if (err) next(err);
      else req.json({ success: true });
    })
});
