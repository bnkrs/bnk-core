var should = require('should');
var assert = require('assert');
var request = require('supertest');

var db = require('./lib/db');

var username = '-username';
var email_username = 'email' + username;
var phrase_username = 'phrase' + username;

var password = 'v3ry_s3cure_password#!';

var email = 'hello@domain.tld';

var emailUser_token = null;
var phraseUser_token = null;

describe('user-account test', function() {
  var url = 'http://localhost:3000';

  // Prepare the tests
  before(function(done) {
    db.init((err) => {
      if (err) {
        console.error("Could not connect to database.");
        process.exit(1);
      }

      db.clearUsers((err) =>{
        if (err && err.message == 'ns not found')
          // Collection doesn't even exist, no need for it to be cleared
          console.log("User-collection was not cleared, as it doesn't exist. This is not an error!");
        else if (err) {
          console.error("Could not clear the users-collection.", err);
          process.exit(1);
        }
        else console.log("User-collection was successfully cleared.")

        done();
      });
    });
  });

  describe('account creation', function() {

    // Try to create an account without username, should give 400-error
    it('should return error trying to create user without username', function(done) {
      var user = {
        password: '98tf#14!9RI',
        email: email,
        recoveryMethod: 'email'
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(400);
        res.body.should.have.property('error');
        res.body.error.message.should.equal('FieldsMissing');
        done();
      });
    });

    // Try to create an account without password, should give 400-error
    it('should return error trying to create user without password', function(done) {
      var user = {
        username: 'helloworld-user1',
        email: email,
        recoveryMethod: 'email'
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(400);
        res.body.should.have.property('error');
        res.body.error.message.should.equal('FieldsMissing');
        done();
      });
    });

    // Try to create an account without username, should give 400-error
    it('should return error trying to create user with invalid recovery method', function(done) {
      var user = {
        username: 'helloworld-user2',
        password: '98tf#14!9RI',
        email: email,
        recoveryMethod: 'xyz'
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(400);
        res.body.should.have.property('error');
        res.body.error.message.should.equal('RecoveryMethodInvalid');
        done();
      });
    });

    it('should return error trying to create user with recovery-method "email", but no email provided', function(done) {
      var user = {
        username: 'helloworld-user3',
        password: '98tf#14!9RI',
        recoveryMethod: 'email'
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(400);
        res.body.should.have.property('error');
        res.body.error.message.should.equal('EmailMissingInvalid');
        done();
      });
    });

    it('should return error trying to create user with invalid email', function(done) {
      var user = {
        username: 'helloworld-user4',
        password: '98tf#14!9RI',
        recoveryMethod: 'email',
        email: 'foobar'
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(400);
        res.body.should.have.property('error');
        res.body.error.message.should.equal('EmailMissingInvalid');
        done();
      });
    });

    it('should return error with usernames including underscores', function(done) {
      var user = {
        username: 'foo_bar',
        password: password,
        recoveryMethod: 'email',
        email: email
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(400);
        res.body.should.have.property('error');
        res.body.error.message.should.equal('UsernameInvalid');

        done();
      });
    });

    it('should return error with usernames including spaces', function(done) {
      var user = {
        username: 'foo bar',
        password: password,
        recoveryMethod: 'email',
        email: email
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(400);
        res.body.should.have.property('error');
        res.body.error.message.should.equal('UsernameInvalid');

        done();
      });
    });

    it('should return error trying to create user with weak password', function(done) {
      var user = {
        username: 'helloworld-user5',
        password: 'foo',
        recoveryMethod: 'email',
        email: email
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(400);
        res.body.should.have.property('error');
        res.body.error.message.should.equal('PasswordTooWeak');
        done();
      });
    });

    it('should successfully create user with email-recovery', function(done) {
      var user = {
        username: email_username,
        password: password,
        recoveryMethod: 'email',
        email: email
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(200);
        res.body.success.should.equal(true);
        done();
      });
    });

    it('should successfully create user with phrase-recovery', function(done) {
      var user = {
        username: phrase_username,
        password: password,
        recoveryMethod: 'phrase'
      };

    request(url)
	    .post('/user/new')
	    .send(user)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(200);
        res.body.should.have.property('phrase');
        res.body.success.should.equal(true);
        done();
      });
    });

  });

  describe('login', () => {

    it('should login in to the email-recovery user', (done) => {
      var auth = {
        username: email_username,
        password: password
      };

    request(url)
	    .post('/auth/getToken')
	    .send(auth)
	    .end(function(err, res) {
        if (err) {
          throw err;
        }

        res.status.should.be.equal(200);
        res.body.should.have.property('token');
        res.body.token.should.be.type('string');
        res.body.validFor.should.be.type('number');

        // Save the token
        emailUser_token = res.body.token;

        done();
      });
    });

    it('should login in to the email-recovery user', (done) => {
      var auth = {
        username: phrase_username,
        password: password
      };

      request(url)
	      .post('/auth/getToken')
	      .send(auth)
	      .end(function(err, res) {
          if (err) {
            throw err;
          }

          res.status.should.be.equal(200);
          res.body.should.have.property('token');
          res.body.token.should.be.type('string');
          res.body.validFor.should.be.type('number');

          // Save the token
          phraseUser_token = res.body.token;

          done();
        });
    });
  });

  describe('account settings', () => {
    it('should be able to switch from email to phrase-based recovery', (done) => {
      var req_body = {
        token: emailUser_token,
        recoveryMethod: "phrase"
      };

      request(url)
	      .post('/user/settings')
	      .send(req_body)
	      .end(function(err, res) {
          if (err) {
            throw err;
          }

          res.status.should.be.equal(200);
          res.body.success.should.be.equal(true);
          res.body.should.have.property("phrase");


            request(url)
              .get('/user/settings')
              .send({token: emailUser_token})
              .end(function(err, res) {

                res.status.should.be.equal(200);
                res.body.recoveryMethod.should.be.equal("phrase");

                done();

              });
        });
    });
  })

});
