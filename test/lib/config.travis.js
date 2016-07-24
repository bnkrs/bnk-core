module.exports = {

  db: 'mongo',

  mongo: {
    url: 'mongodb://localhost/bnk'
  },

  // Secret phrase or private key contents for jwt
  jwtSec: "helloworld",

  // 3 should be a good value here
  zxcvbn_minScore: 4

}
