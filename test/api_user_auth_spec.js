var frisby = require('frisby');

var url = 'http://localhost:3000/';
var username = 'jon';
var password = 'a_v3ry_s3cure_pwd';
var email = 'my.mail@provider.tld';

frisby.create('Try to log in with missing credentials')
  .post(url + 'auth/getToken', {})
    .expectStatus(400)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSON({
      error: {
        code: 400,
        message: "UsernamePasswordMissing"
      }
    }).toss()


frisby.create('Try to log in with non-existing user')
  .post(url + 'auth/getToken', {
    username: username + '_mail',
    password: password
  })
    .expectStatus(401)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSON({
      error: {
        code: 401,
        message: "UsernamePasswordWrong"
      }
    })

frisby.create('Try to create user with no parameters')
  .post(url + 'user/new', {})
    .expectStatus(400)
    .toss()
frisby.create('Try to create user with empty parameters')
  .post('http://localhost:3000/user/new', {
    username: '',
    password: '',
    recoveryMethod: 'phrase'
  })
    .expectStatus(400)
    .expectJSON({ error: { message: "FieldsMissing" } })
    .toss()
frisby.create('Try to create user with missing email-parameter')
  .post(url + 'user/new', {
    username: username + '_mail',
    password: password,
    recoveryMethod: 'email'
  })
    .expectStatus(400)
    .expectJSON({ error: { message: 'EmailMissingInvalid' } })
    .toss();

frisby.create('Create user with email-recovery')
  .post(url + 'user/new', {
    username: username + '_mail',
    password: password,
    recoveryMethod: 'email',
    email: email
  })
    .expectStatus(200)
    .expectJSON({success: true})
    .toss();

frisby.create('Create user with phrase-recovery')
  .post(url + 'user/new', {
    username: username + '_phrase',
    password: password,
    recoveryMethod: 'phrase'
  })
    .expectStatus(200)
    .expectJSON({success: true})
    .expectJSONTypes({
      phrase: [String]
    })
    .toss();

frisby.create('Get api-token for email-user')
  .post(url + 'auth/getToken', {
    username: username + '_mail',
    password: password
  })
    .expectStatus(200)
    .expectJSONTypes({ token: String })
    .afterJSON(function (response) {
      var emailUserToken = response.token;
      frisby.create('Verify email-user\'s default settings')
        .get(url + 'user/settings?token=' + encodeURIComponent(emailUserToken))
          .expectStatus(200)
          .expectJSON({
            transactionLogging: false,
            smsNotificationNumber: null,
            recoveryMethod: "email",
            email: email
          })
          .toss();
    })
    .toss();

frisby.create('Get api-token for phrase-user')
  .post(url + 'auth/getToken', {
    username: username + '_phrase',
    password: password
  })
    .expectStatus(200)
    .expectJSONTypes({ token: String })
    .afterJSON(function (response) {
      var phraseUserToken = response.token;
      frisby.create('Verify phrase-user\'s default settings')
        .get(url + 'user/settings?token=' + encodeURIComponent(phraseUserToken))
          .expectStatus(200)
          .expectJSON({
            transactionLogging: false,
            smsNotificationNumber: null,
            recoveryMethod: "phrase",
          })
          .toss();
    })
    .toss();
