const express = require('express');
const path = require('path')
var bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const dbConnect = require('./services/database-services');
const qp = require('./services/query-parser');
require('dotenv').config({path : path.resolve(__dirname, '../../build-resource/wallet/.env')});
const { v4: uuidv4 } = require('uuid'); // for generating unique IDs


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
    await dbConnect.initialize();
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

// Endpoint to add a grant to the queue
app.post('/api/addToGrantQueue', async (req, res) => {
  try{
    await dbConnect.initialize();
    const grant = req.body;
    grant.id = uuidv4();
    await dbConnect.enqueueGrantOpportunity(grant);
    res.status(200).send({ message: 'Grant added to queue' });
    await dbConnect.close();
  } catch (e){
    console.log("Error while submitting grant", e);
  }
  
});

// Endpoint to add a grant to the main database
app.post('/api/addToDatabase', async (req, res) => {
  try{
    await dbConnect.initialize();
    const grant = req.body;
    await dbConnect.enqueueGrantOpportunityMain(grant);
    res.status(200).send({ message: 'Grant added to main database' });
    await dbConnect.close();
  } catch (e){
    console.log("Error while submitting grant", e);
  }

  
});

// Endpoint to get the grant queue
app.get('/api/getGrantQueue', async (req, res) => {
  try{
    await dbConnect.initialize();
    // Assuming you have a function to fetch grants from your database
    const grants = await dbConnect.simpleExecute(`SELECT * FROM USERSUBMITTEDGRANTS`, [], {});
    res.json(grants);
    await dbConnect.close();
    
  }catch(e){
    console.log("Error while fetching: ", e);
  }
  
});


// Endpoint to remove a grant from the queue by ID
app.post('/api/removeFromGrantQueue/', async (req, res) => {
  await dbConnect.initialize();
  const id = req.body.post;
  await dbConnect.removeGrantOpportunity(id);
  //re-update grants after delete
  const grants = await dbConnect.simpleExecute(`SELECT * FROM USERSUBMITTEDGRANTS`, [], {});
  res.json(grants);
  await dbConnect.close();
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