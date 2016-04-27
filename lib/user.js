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

var recPhraseLength = 10;

function newError(message, code) {
  var err = new Error(message);
  err.status = code;
  return err;
}

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
      transactions: {},
    }

    // Name will get converted to lower case and trimmed
    db.getUserByName(username, function (err, user) {
      if (err) callback(err);
      else if (user !== null) callback(newError("UserExists", 400), false);
      else if (generic.checkPasswordStrength(password) < config.pwdStrengthMin)
        callback(newError("PasswordTooWeak", 400), false);
      else if (recoveryMethod !== "phrase" && recoveryMethod !== "email")
        callback(newError("RecoveryMethodInvalid", 400), false);
      else if (recoveryMethod === "email" && !emailValidator.validate(email))
        callback(newError("EmailMissingInvalid", 400), false);
      else {
        bcrypt.hash(password, null, null, function (err, result) {
          if (err) callback(err);
          else {
            // Store hashed password
            userInsert.password = result;

            // Generate and store recovery-phrase / email
            var recoveryPhrase = randomWords(recPhraseLength);
            if (recoveryMethod === "phrase")
              userInsert.recovery.phrase = bcrypt.hashSync(recoveryPhrase.toString());
            else
              userInsert.recovery.email = email;

            db.insertUser(userInsert, function (err, user) {
              if (err) callback(err);
              if (!user) callback(new Error("UnknownError"), false);

              // If reached up to here, account was successfully created!
              else if (recoveryMethod === "email")
                // Send the verification-email
                libEmail.sendConfirmationEmail(email, user._id, function (err) {
                  if (err) callback(new Error("UnknownError"), true);
                  else callback(null, true);
                });
              else
                // Callback with non-hashed recovery-phrase
                callback(null, true, recoveryPhrase);
            })
          }
        })
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
    }
    else if (user.recovery.phrase)
      settings.recoveryMethod = "phrase";

    callback(null, settings);

  },

  applySettings: function userApplySettings (user, settings, callback) {
    if (settings.recoveryMethod !== null && 
      settings.recoveryMethod !== "email" && settings.recoveryMethod !== "phrase")
      return callback(new Error("InvalidRecoveryMethod"));

    if (user.recovery.email && settings.recoveryMethod === "phrase") {
      // User switched from email to phrase recovery, disable email & generate phrase
      user.recovery.email = null;
      user.recovery.emailVerified = false;
      var recoveryPhrase = randomWords(recPhraseLength);
      user.recovery.phrase = bcrypt.hashSync(recoveryPhrase.toString());
    }

    if (settings.recoveryMethod === "email") {
      user.recovery.phrase = null;
      if (settings.email) {
        if (emailValidator.validate(settings.email))
          user.recovery.email = settings.email;
        else return callback(new Error("EmailMissingInvalid"))
      }
      else if (!user.recovery.email)
        return callback(new Error("EmailMissingInvalid"))
    }

    if (settings.transactionLogging !== null && settings.transactionLogging !== undefined) {
      switch (settings.transactionLogging) {
        case "true":
          user.settings.transactionLogging = true;
          break;
        case "false":
          user.settings.transactionLogging = false;
          break;
        case true, false:
          user.settings.transactionLogging = settings.transactionLogging;
          break;
        default:
          return callback(new Error("InvalidSetting"));
          break;
      }
    }

    if (settings.smsNotificationNumber === "-")
      user.settings.smsNotificationNumber = null;
    else
      user.settings.smsNotificationNumber = settings.smsNotificationNumber;

    db.updateUser(user, function (err, newUser) {
      if (err) callback(err);
      else if (user.recovery.phrase) callback(null, true, recoveryPhrase);
      else callback(null, true);
    })
  }


}