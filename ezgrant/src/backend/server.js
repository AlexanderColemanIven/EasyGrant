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
  console.log(`Listening on port ${port}`);
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
  try {
    await dbConnect.initialize()
    // Extract features, generate SQL, and get binds
    const features = await qp.extractFeatures(req.body.post);
    const sql = qp.generate_query(features);
    const binds = qp.get_binds(features);
    // Execute the SQL query
    const options = { outFormat: null };
    const retval = await dbConnect.simpleExecute(sql, binds, options);
    // Log the result and send the response
    res.send({ express: retval });
    await dbConnect.close();
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
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

// Temporary storage for the grant queue
let grantQueue = [];

// Endpoint to add a grant to the queue
app.post('/api/addToGrantQueue', (req, res) => {
  const grant = req.body;
  grantQueue.push(grant);
  res.status(200).send({ message: 'Grant added to queue' });
});

// Endpoint to get the grant queue
app.get('/api/getGrantQueue', (req, res) => {
  res.status(200).send(grantQueue);
});

// Endpoint to remove a grant from the queue by ID
app.delete('/api/removeFromGrantQueue/:id', (req, res) => {
  const { id } = req.params;
  grantQueue = grantQueue.filter((grant) => grant.id !== id);
  res.status(200).send({ message: `Grant with ID ${id} removed` });
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