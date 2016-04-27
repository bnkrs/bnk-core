module.exports = {

  // Mongo is the only supported db-backend currently
  db: 'mongo',

  // Mongodb-configuration
  mongo: {
    // Run travis-tests without authentification
    url: 'mongodb://localhost/bnk'
  },

  // Secret phrase or private key contents for jwt
  // Just helloworld for travis
  jwtSec: "helloworld",

  // The password-strength is not implemented yet, using
  // some random value here
  pwdStrengthMin: 10

}