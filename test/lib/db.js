var app_cfg = require('../../config');

var db = require('../../db/' + app_cfg.db);

module.exports = {

  init: (callback) => {
    db.connect(app_cfg[app_cfg.db], callback);
  },

  clearUsers: (callback) => {
    if (db.dropUsers === undefined) {
      console.error("NODE_ENV is not set to development,",
        "so some dangerous functions are not available.");
      process.exit(1);
    }
    db.dropUsers(callback);
  }

};
