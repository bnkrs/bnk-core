var config = require('../config');
var db = require('../db/' + config.db);

var generic = require('./generic');
var newError = generic.newError;

module.exports = {

  addMoney: function adminAddMoney(admin_username, username, value, callback) {
    value = parseFloat(value);
    if (value % 1 != 0 || value <= 0)
      callback(newError('BadRequest', 400));
    else
      db.getUserByName(username, (err, user) => {
        if (err) next(err);
        else if (!user)
          next(newError('ReceiverNotFound', 400));
        else {
          value = parseInt(value);

          var transaction = {
            sender: 'admin_' + admin_username,
            receiver: user.username,
            value: value,
            timestamp: Date.now()
          }

          user.balance += value;
          if (user.settings.transactionLogging)
            user.transactions.push(transaction);
        }
      });
  }

}
