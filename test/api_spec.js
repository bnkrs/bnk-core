var frisby = require('frisby');

frisby.create('Get basic API-info')
  .get('http://localhost:3000/')
    .expectStatus(200)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSONTypes({
        app: String,
        version: String
    })
    .expectJSON({ app: "bnk-core" })

.toss();