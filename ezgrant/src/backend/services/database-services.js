Error.stackTraceLimit = 50;
const path = require('path')
require('dotenv').config({path : path.resolve(__dirname, '../../../build-resource/wallet/.env')});
const oracledb = require('oracledb');
const dbConfig = require('dbconfig');

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

async function initialize() {
  console.log("Connecting as user: " + dbConfig.ezgrantPool.user);
  try {
    await oracledb.createPool(dbConfig.ezgrantPool);
  }catch(e){
    console.log(e);
    initialize();
  }
  
}

module.exports.initialize = initialize;

async function close() {
  try{
    await oracledb.getPool().close(0);
  }catch(e){
    //do nothing
  }
  
}

module.exports.close = close;

async function simpleExecute(statement, binds = [], opts = {}) {
  let conn;
  let result = [];

  opts.outFormat = oracledb.OUT_FORMAT_OBJECT;

  try {
    conn = await oracledb.getConnection();
    result = await conn.execute(statement, binds, opts);
    result = result.rows;
  } catch (err) {
    console.error(err);
    throw (err);
  } 
  return result;
}

module.exports.simpleExecute = simpleExecute;

async function enqueueGrantOpportunity(newEntry) {
  if(newEntry.link === null){ //must have a link field
      return;
  }
  newEntry.eligibility = newEntry.eligibility.split(" ");
  console.log(newEntry);
  let connection;

  try {
    // Create a connection to the Oracle database
    connection = await oracledb.getConnection();

    // Convert the ELIGIBILITY list to a PL/SQL VARRAY declaration
    const eligibilityArray = newEntry.eligibility.map(item => `'${item}'`).join(',');

    // PL/SQL anonymous block to insert values into the ELIGIBILITY VARRAY
    const plsqlBlock = `
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
      name: newEntry.name,
      location: newEntry.location,
      link: newEntry.link,
      amount: newEntry.amount,
      about: newEntry.description,
      free: newEntry.free,
      deadline: newEntry.deadline,
      dateSubmitted: newEntry.dateSubmitted,
      id: newEntry.id
    };

    // Execute the PL/SQL block
    await connection.execute(plsqlBlock, binds, { autoCommit: true });

  } catch (error) {
    // Check if the error is due to a duplicate entry
    if (error.errorNum === 1 && error.sqlState === '23000') {
      console.log('Duplicate entry: ignoring error.');
    } else {
      console.error('Error inserting into USERSUBMITTEDGRANTS table:', error);
    }
  }finally {
    // Release the Oracle database connection
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}

module.exports.enqueueGrantOpportunity = enqueueGrantOpportunity;


async function removeGrantOpportunity(id) {
  let connection;

  try {
    // Create a connection to the Oracle database
    connection = await oracledb.getConnection();

    // PL/SQL anonymous block to insert values into the ELIGIBILITY VARRAY
    const plsqlBlock = `DELETE FROM USERSUBMITTEDGRANTS WHERE ID = :id`;

    // Bind the input values to the PL/SQL block
    const binds = {
      id: id
    };

    // Execute the PL/SQL block
    await connection.execute(plsqlBlock, binds, { autoCommit: true });

  } catch (error) {
    // Check if the error is due to a duplicate entry
    if (error.errorNum === 1 && error.sqlState === '23000') {
      console.log('Duplicate entry: ignoring error.');
    } else {
      console.error('Error inserting into USERSUBMITTEDGRANTS table:', error);
    }
  }finally {
    // Release the Oracle database connection
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}

module.exports.removeGrantOpportunity = removeGrantOpportunity;

async function getGrantOpportunities() {
  await initialize();
  let connection;

  try {
    // Create a connection to the Oracle database
    connection = await oracledb.getConnection();
    const opts = {};
    opts.outFormat = oracledb.OUT_FORMAT_OBJECT;

    // PL/SQL anonymous block to dequeue the oldest item from the queue and remove it
    const plsqlBlock = `
      SELECT * FROM USERSUBMITTEDGRANTS`;

    // Execute the PL/SQL block
    const result = await connection.execute(plsqlBlock, [], opts);
    return result;
  } catch (error) {
    // Handle connection errors, and attempt to reconnect
    if (error.errorNum === 1017) {
      console.error('Connection error, attempting to reconnect...');
      // Add logic to reconnect
    } else {
      console.error('Error fetching USERSUBMITTEDGRANTS table:', error);
    }
  }
}

module.exports.getGrantOpportunities = getGrantOpportunities;