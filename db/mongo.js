var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;

var db = null;

/**
 * This is a very, very, very dangerous function and may lead to catastrophic
 * data loss. Therefore, only define it if in development-mode.
 */
var mongoDropUsers = undefined;
if (process.env.NODE_ENV === "development")
  mongoDropUsers = function mongoDropUsers (callback) {
    db.collection('users').drop(callback);
  };

module.exports = {
  connect: function mongoConnect (cfg, callback) {
    MongoClient.connect(cfg.url, function(err, pdb) {
      if (err)
        callback(err);
      else {
        db = pdb;
        callback(null);
      }
    });
  },

  disconnect:function mongoDisconnect () {
    db.close();
  },

  insertUser: function mongoInsertUser (user, callback) {
    user.username = user.username.toLowerCase().trim();
    db.collection('users').insert(user, callback);
  },

  getUserByName: function mongoGetUserByName (username, callback) {
    db.collection('users').findOne({ username: { $eq: username.toLowerCase().trim() } }, function (err, user) {
      if (err) callback(err);
      else callback(null, user);
    });
  },

  getUserByID: function mongoGetUserByID (id, callback) {
    db.collection('users').findOne({ _id: { $eq: new mongo.ObjectId(id) } }, function (err, user) {
      if (err) callback(err);
      else callback(null, user);
    });
  },

  updateUser: function mongoUpdateUser (user, callback) {
    db.collection('users').update({ _id: { $eq: new mongo.ObjectId(user._id) } }, user, {upsert: true}, function(err, count, user) {
      if (err) callback(err);
      else callback(null, user);
    });
  },

  deleteUser: function mongoDeleteUser (id, callback) {
    db.collection('users').deleteOne({ _id: { $eq: new mongo.ObjectId(id) } }, function (err) {
      if (err) callback(err);
      else callback(null);
    });
  },

  dropUsers: mongoDropUsers
};
