var config = require('../config');
var db = require('../db/' + config.db);

var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');

module.exports = {
  
  checkPassword: function authCheckPassword (username, password, callback) {
    db.getUserByName(username, function (err, user) {
      if (err) callback(err);
      else if (!user) callback(null, false);
      else
        bcrypt.compare(password, user.password, function (err, result) {
          if (result == true)
            callback(null, true, user._id);
          else
            callback(null, false);
        });
    });
  },

  issueJWT: function authIssueJWT (id, expiresIn, callback) {
    var token = jwt.sign({id: id}, config.jwtSec, {expiresIn: expiresIn});
    callback(null, token);
  },

  verifyJWT: function authVerifyJWT (token, callback) {
    jwt.verify(token, config.jwtSec, function(err, payload) {
      // If error, the token's probably invalid
      if (err) callback(null, null);
      else callback(null, payload);
    })
  },

  // Middleware for use in routers
  requireAuthenticated: function authRequireAuthenticated (req, res, next) {
    var token = null;
    
    if (req.query.token) token = req.query.token;
    else if (req.body.token) token = req.body.token;

    if (token === null) {
      var err = new Error('NoTokenProvided');
      err.status = 401;
      next(err);
    } else
      module.exports.verifyJWT(token, function (err, payload) {
        if (err) next(err);
        else if (payload === null) {
          var err = new Error('NotAuthenticated');
          err.status = 401;
          next(err);
        }
        else
          db.getUserByID(payload.id, function (err, user) {
            if (err) next(err);
            else if (!user) {
              next(new Error('UserNotFound'));
            }
            else {
              req.user = user;
              next();
            }
          });
    });
  }

}