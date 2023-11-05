const express = require('express');
const path = require('path')
var bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const dbConnect = require('./services/database-services');
const qp = require('./services/query-parser');
require('dotenv').config({path : path.resolve(__dirname, '../../build-resource/wallet/.env')});


const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(port, async () => {
  await dbConnect.close();  // avoid any pool cache issues
  console.log(`Listening on port ${port}`)
  await dbConnect.initialize();
});

const credentials = {
  uname: "user",
  password: ""
}
const SALT_ROUNDS = 10;

bcrypt.hash(process.env.AUTH_PASSWORD, SALT_ROUNDS, function(err, hash) {
  credentials.password = hash;
});

app.post('/api/database', async (req, res) => {
  const features = await qp.extractFeatures(req.body.post);
  const sql = qp.generate_query(features);
  const binds = qp.get_binds(features);
  const options = { outFormat: null };
  const retval = await dbConnect.simpleExecute(sql, binds, options);
  //console.log(retval);
  res.send({express: retval});
});

app.post('/api/login', async (req, res) => {
  bcrypt.compare(req.body.post[1], credentials.password).then((result)=>{
    const attempt_results = {
      match_username: req.body.post[0] === credentials.uname,
      match_password: result
    }
    res.send({express: attempt_results});
  });
});


process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

function gracefulShutdown (signal) {
  if (signal) console.log(`\nReceived signal ${signal}`);
  console.log('Closing http server');

  try {
    server.close(function (err) {
      if (err) {
        console.error('There was an error', err.message)
        process.exit(1)
      } else {
        console.log('http server closed successfully. Exiting!')
        process.exit(0)
      }
    })
  } catch (err) {
    console.error('There was an error', err.message)
    setTimeout(() => process.exit(1), 500)
  }

}