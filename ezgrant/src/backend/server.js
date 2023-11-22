const express = require('express');
const path = require('path')
var bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const dbConnect = require('./services/database-services');
const qp = require('./services/query-parser');
require('dotenv').config({path : path.resolve(__dirname, '../../build-resource/wallet/.env')});
const { v4: uuidv4 } = require('uuid'); // for generating unique IDs
const oracledb = require('oracledb');
const dbConfig = require('dbconfig');
const { connect } = require('http2');

if (process.env.NODE_ORACLEDB_DRIVER_MODE === 'thick') {

  //Thick mode is apparently req here to utilize a TNS connection (including both OS's for group)
  let clientOpts = {};
  if (process.platform === 'win32') {                                   // Windows
    clientOpts = { libDir: 'C:\\oracle\\instantclient_19_17' };
    oracledb.initOracleClient(clientOpts);  // enable node-oracledb Thick mode
  } else if (process.platform === 'darwin' && process.arch === 'x64') { // macOS Intel
    clientOpts = { libDir: process.env.HOME + '/Downloads/instantclient_19_8' };
    oracledb.initOracleClient(clientOpts);  // enable node-oracledb Thick mode
  } else {
    oracledb.initOracleClient();
  }
  
}

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(port, async () => {
  await dbConnect.close();  // avoid any pool cache issues
  console.log(`Listening on port ${port}`);
  await oracledb.createPool(dbConfig.ezgrantPool);
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
  let connection;
  try {
    connection = await oracledb.getConnection();
    // Extract features, generate SQL, and get binds
    const features = await qp.extractFeatures(req.body.post);
    const sql = qp.generate_query(features);
    const binds = qp.get_binds(features);
    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const retval = await connection.execute(sql, binds, options);
    // Log the result and send the response
    res.send({ express: retval.rows });
    //await dbConnect.close();
  } catch (err) {
    // Log and handle errors
    console.error(err);
    console.error(err.stack);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
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
  let connection;
  try {
    connection = await oracledb.getConnection();
    const grant = req.body;
    grant.id = uuidv4();
    grant.eligibility = grant.eligibility.split(" ");
    const eligibilityArray = grant.eligibility.map(item => `'${item}'`).join(',');
    const sql = `
      DECLARE
        eligibility_list ELIGIBLE_LIST := ELIGIBLE_LIST(${eligibilityArray});
      BEGIN
        INSERT INTO USERSUBMITTEDGRANTS (NAME, LOCATION, LINK, AMOUNT, ABOUT, FREE, ELIGIBILITY, DEADLINE, TIME, ID)
        VALUES (:name, :location, :link, :amount, :about, :free, eligibility_list, :deadline, :dateSubmitted, :id);
      EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
          NULL; -- Ignore duplicate entry error
      END;
    `;

    // Bind the input values to the PL/SQL block
    const binds = {
      name: grant.name,
      location: grant.location,
      link: grant.link,
      amount: grant.amount,
      about: grant.description,
      free: grant.free,
      deadline: grant.deadline,
      dateSubmitted: grant.dateSubmitted,
      id: grant.id
    };

    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true };
    const add = await connection.execute(sql, binds, options);
    res.status(200).send({ message: 'Grant added to queue' });
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Endpoint to add a grant to the main database
app.post('/api/addToDatabase', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const grant = req.body;

    const eligibilityArray = grant.ELIGIBILITY.map(item => `'${item}'`).join(',');
    const sql = `
      DECLARE
        eligibility_list ELIGIBLE_LIST := ELIGIBLE_LIST(${eligibilityArray});
      BEGIN
        INSERT INTO GRANTOPPORTUNITIES (NAME, LOCATION, LINK, AMOUNT, ABOUT, FREE, ELIGIBILITY, DEADLINE)
        VALUES (:name, :location, :link, :amount, :about, :free, eligibility_list, :deadline);
      EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
          NULL; -- Ignore duplicate entry error
      END;
    `;

    // Bind the input values to the PL/SQL block
    const binds = {
      name: grant.NAME,
      location: grant.LOCATION,
      link: grant.LINK,
      amount: grant.AMOUNT,
      about: grant.DESCRIPTION,
      free: grant.FREE,
      deadline: grant.DEADLINE,
    };

    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true };
    const add = await connection.execute(sql, binds, options);
    res.status(200).send({ message: 'Grant added to main database' });
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Endpoint to get the grant queue
app.get('/api/getGrantQueue', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const sql = `SELECT * FROM USERSUBMITTEDGRANTS`;
    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const grants = await connection.execute(sql, [], options);
    // Log the result and send the response
    res.json(grants.rows);
    //await dbConnect.close();
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
  
});

app.post('/api/getGrantByID', async (req, res) => {
  let connection;
  try{
    connection = await oracledb.getConnection();
    const id = req.body.post;
    const binds = {
      id: id
    };
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const grant = await connection.execute(`SELECT * FROM USERSUBMITTEDGRANTS WHERE ID = :id FETCH FIRST 1 ROW ONLY`, binds, options);
    res.json(grant.rows[0]);
    
  }catch(e){
    console.log("Error while fetching: ", e);
  }finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
  
});

app.post('/api/modifyGrantByID', async (req, res) => {
  let connection;
  try{
    connection = await oracledb.getConnection();
    const grant = req.body.post;

    const eligibilityArray = grant.ELIGIBILITY.map(item => `'${item}'`).join(',');

    const sql = `
      UPDATE USERSUBMITTEDGRANTS
      SET
        ABOUT = :about,
        AMOUNT = :amount,
        DEADLINE = TO_DATE(:deadline, 'YYYY-MM-DD'),
        ELIGIBILITY = ELIGIBLE_LIST(${eligibilityArray}),
        FREE = :free,
        LINK = :link,
        LOCATION = :location,
        NAME = :name
      WHERE ID = :id
    `;

    const binds = {
      about: grant.ABOUT,
      amount: grant.AMOUNT,
      deadline: grant.DEADLINE,
      free: grant.FREE,
      link: grant.LINK,
      location: grant.LOCATION,
      name: grant.NAME,
      id: grant.ID,
    };
    const modOptions = { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true }
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

    const result = await connection.execute(sql, binds, modOptions);

    console.log('Rows updated:', result.rowsAffected);

    const fetchSql = `SELECT * FROM USERSUBMITTEDGRANTS`;
    const grants = await connection.execute(fetchSql, [], options);
    res.json(grants.rows);
  } catch (error) {
    console.error('Error updating grant in database:', error);
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


// Endpoint to remove a grant from the queue by ID
app.post('/api/removeFromGrantQueue/', async (req, res) => {
  let connection;
  try{
    connection = await oracledb.getConnection();
    const id = req.body.post;

    const sql = `DELETE FROM USERSUBMITTEDGRANTS WHERE ID = :id`;

    const binds = {
      id: id
    };

    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    
    const del = await connection.execute(sql, binds, { autoCommit: true });

    const fetchSql = `SELECT * FROM USERSUBMITTEDGRANTS`;
    const grants = await connection.execute(fetchSql, [], options);
    res.json(grants.rows);
  } catch (error) {
    console.error('Error updating grant in database:', error);
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
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