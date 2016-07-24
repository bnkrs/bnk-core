var config = require('../config');
var db = require('../db/' + config.db);

var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');

var generic = require('./generic');
var newError = generic.newError;

module.exports = {

  checkPasswordByUsername: function authCheckPasswordByUsername (username, password, callback) {
    db.getUserByName(username, function (err, user) {
      if (err) {
        callback(err);
      } else if (!user) {
        callback(null, false);
      } else {
        module.exports.checkPassword(user, password, callback);
      }
    });
  },

  checkPassword: function authCheckPassword (user, password, callback) {
    bcrypt.compare(password, user.password, function (err, result) {
      if (result === true) {
        callback(null, true, user);
      } else {
        callback(null, false);
      }
    });
  },

  issueJWT: function authIssueJWT (user, expiresIn, callback) {
    var token = jwt.sign({
      id: user._id,
      revstr: user.revocationString
    }, config.jwtSec, {expiresIn: expiresIn});
    callback(null, token);
  },

  verifyJWT: function authVerifyJWT (token, callback) {
    jwt.verify(token, config.jwtSec, function(err, payload) {
      // If error, the token's probably invalid
      if (err) {
        callback(null, null);
      } else {
        callback(null, payload);
      }
    });
  },

  // Middleware for use in routers
  requireAuthenticated: function authRequireAuthenticated (req, res, next) {
    var token = null;

    if (req.query.token) {
      token = req.query.token;
    } else if (req.body.token) {
      token = req.body.token;
    }

    if (token === null) {
      next(newError('NoTokenProvided', 400));
    } else {
      module.exports.verifyJWT(token, function (err, payload) {
        if (err) {
          next(err);
        } else if (payload === null) {
          next(newError('NotAuthenticated', 401));
        } else {
          db.getUserByID(payload.id, function (err, user) {
            if (err) {
              next(err);
            } else if (!user) {
              next(new Error('UserNotFound'));
            } else if (user.revocationString !== payload.revstr) {
              // Token was revoked
              next(newError('NotAuthenticated', 401));
            } else {
              req.user = user;
              next();
            }
          });
        }
      });
    }
  },

  requireAdmin: function authRequireAdmin (req, res, next) {
    module.exports.requireAuthenticated(req, res, (err) => {
      if (err) {
        next(err);
      } else if (req.user.isAdmin === true) {
        next();
      } else {
        next(new Error('NotAdmin', 401));
      }
    });
  }

};
