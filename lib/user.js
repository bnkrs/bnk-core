/**
 * User-Management
 */
var config = require('../config');

var db = require('../db/' + config.db);
var libEmail = require('./email');
var generic = require('./generic');

var bcrypt = require('bcrypt-nodejs');
var emailValidator = require('email-validator');
var randomWords = require('random-words');
var async = require('async');
var zxcvbn = require('zxcvbn');

var auth = require('./auth');

var recPhraseLength = 10;

var newError = generic.newError;

module.exports = {
  new: function userNew (username, password, recoveryMethod, email, callback) {
    var userInsert = {
      username: username,
      password: null,
      recovery: {
        phrase: null,
        email: null,
        emailVerified: false
      },
      settings: {
        transactionLogging: false,
        smsNotificationNumber: null
      },
      balance: 0,
      transactions: [],
      isAdmin: false,
      isGuest: false
    };

    if (username.indexOf('_') > -1 || username.indexOf(' ') > -1) {
      return callback(newError("UsernameInvalid", 400));
    }

    // Name will get converted to lower case and trimmed
    db.getUserByName(username, function (err, user) {
      if (err) {
        callback(err);
      } else if (user !== null) {
        callback(newError("UserExists", 400), false);
      } else if (zxcvbn(password).score < config.zxcvbn_minScore || !config.zxcvbn_minScore) {
        callback(newError("PasswordTooWeak", 400), false);
      } else if (recoveryMethod !== "phrase" && recoveryMethod !== "email") {
        callback(newError("RecoveryMethodInvalid", 400), false);
      } else if (recoveryMethod === "email" && !emailValidator.validate(email)) {
        callback(newError("EmailMissingInvalid", 400), false);
      } else {
        bcrypt.hash(password, null, null, function (err, result) {
          if (err) {
            callback(err);
          } else {
            // Store hashed password
            userInsert.password = result;

            // Generate and store recovery-phrase / email
            var recoveryPhrase = randomWords(recPhraseLength);
            if (recoveryMethod === "phrase") {
              userInsert.recovery.phrase = bcrypt.hashSync(recoveryPhrase.toString());
            } else {
              userInsert.recovery.email = email;
            }

            db.insertUser(userInsert, function (err, user) {
              if (err) {
                callback(err);
              } else if (!user) {
                callback(new Error("UnknownError"), false);
              } else if (recoveryMethod === "email") {
                // Send the verification-email
                libEmail.sendConfirmationEmail(email, user._id, function (err) {
                  if (err) {
                    callback(new Error("UnknownError"), true);
                  } else {
                    callback(null, true);
                  }
                });
              } else {
                // Callback with non-hashed recovery-phrase
                callback(null, true, recoveryPhrase);
              }
            });
          }
        });
      }
    });
  },

  getSettings: function userGetSettings (user, callback) {
    // Just return the settings-object here, all properties
    // in there are designed to be shown to the user
    var settings = user.settings;
    if (user.recovery.email) {
      settings.recoveryMethod = "email";
      settings.email = user.recovery.email;
    } else if (user.recovery.phrase) {
      settings.recoveryMethod = "phrase";
    }

    callback(null, settings);

  },

  applySettings: function userApplySettings (user, settings, callback) {
    if (settings.recoveryMethod !== null && settings.recoveryMethod !== undefined &&
        settings.recoveryMethod !== "email" && settings.recoveryMethod !== "phrase") {
      return callback(new Error("InvalidRecoveryMethod"));
    } else if (user.recovery.email && settings.recoveryMethod === "phrase") {
      // User switched from email to phrase recovery, disable email & generate phrase
      user.recovery.email = null;
      user.recovery.emailVerified = false;
      var recoveryPhrase = randomWords(recPhraseLength);
      user.recovery.phrase = bcrypt.hashSync(recoveryPhrase.toString());
    } else if (settings.recoveryMethod === "email") {
      user.recovery.phrase = null;
      if (settings.email) {
        if (emailValidator.validate(settings.email)) {
          user.recovery.email = settings.email;
        } else {
          return callback(new Error("EmailMissingInvalid"));
        }
      } else if (!user.recovery.email) {
        return callback(new Error("EmailMissingInvalid"));
      }
    }

    if (settings.transactionLogging !== null && settings.transactionLogging !== undefined) {
      switch (settings.transactionLogging) {
        case "true":
          user.settings.transactionLogging = true;
          break;
        case "false":
          user.settings.transactionLogging = false;
          break;
        case true:
          user.settings.transactionLogging = true;
          break;
        case false:
          user.settings.transactionLogging = false;
          break;
        default:
          return callback(new Error("InvalidSetting"));
          break;
      }
    }

    if (settings.smsNotificationNumber === "-") {
      user.settings.smsNotificationNumber = null;
    } else {
      user.settings.smsNotificationNumber = settings.smsNotificationNumber;
    }

    db.updateUser(user, function (err, newUser) {
      if (err) {
        callback(err);
      } else if (user.recovery.phrase) {
        callback(null, true, recoveryPhrase);
      } else {
        callback(null, true);
      }
    });
  },

  balance: function userGetBalance (user, callback) {
    if (isNaN(user.balance) || user.balance === null) {
      callback(new Error("UnknownError"))
    } else {
      callback(null, user.balance);
    }
  },

  transactions: function userGetTransactions (user, callback) {
    callback(null, user.transactions);
  },

  sendMoney: function userSendMoney (user, receiverName, value, callback) {
    value = parseFloat(value);
    if (isNaN(parseInt(value, 10)) || !isFinite(value) || value < 1 || value % 1 !== 0) {
      callback(newError("BadRequest", 400));
    } else if (!receiverName) {
      callback(newError("BadRequest", 400));
    } else {
      db.getUserByName(receiverName, function (err, receiver) {
        if (err) {
          callback(err);
        } else if (!receiver) {
          callback(newError("ReceiverNotFound", 400));
        } else if (user.balance < value) {
          callback(newError("BalanceInsufficient"));
        } else {
          var transaction = {
            sender: user.username,
            receiver: receiver.username,
            value: value,
            timestamp: Date.now()
          };

          user.balance -= value;
          if (user.settings.transactionLogging) {
            user.transactions.push(transaction);
          }

          receiver.balance += value;
          if (receiver.settings.transactionLogging) {
            receiver.transactions.push(transaction);
          }

          async.waterfall([
            (cb) => { db.updateUser(user, (err) => { cb(err); }); },
            (cb) => { db.updateUser(receiver, (err) => { cb(err);} ); }
          ], (err) => {
            if (err) {
              callback(err);
            } else {
              callback(null);
            }
          });
        }
      });
    }
  },

  changePassword: function userChangePassword (user, oldPassword, newPassword, callback) {
    auth.checkPassword(user, oldPassword, (err, valid) => {
      if (err) {
        callback(err);
      } else if (!valid) {
        callback(newError("PasswordWrong", 400));
      } else if(generic.checkPasswordStrength(newPassword) < config.pwdStrengthMin) {
          callback(newError("PasswordTooWeak", 400));
      } else {
        bcrypt.hash(newPassword, null, null, (err, result) => {
          if (err) {
            callback(err);
          } else {
            user.password = result;
            db.updateUser(user, (err) => {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          }
        });
      }
    });
  }
};
