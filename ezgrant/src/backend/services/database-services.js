Error.stackTraceLimit = 50;
const path = require('path')
require('dotenv').config({path : path.resolve(__dirname, '../../../build-resource/wallet/.env')});
const oracledb = require('oracledb');
const dbConfig = require('dbconfig');

async function initialize() {
  console.log("Connecting as user: " + dbConfig.ezgrantPool.user);
  try {
    await oracledb.createPool(dbConfig.ezgrantPool);
  }catch(e){
    console.log(e);
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

async function enqueueGrantOpportunityMain(newEntry) {
  if(newEntry.link === null){ //must have a link field
      return;
  }
  let connection;

  const eligibilityArray = newEntry.ELIGIBILITY.map(item => `'${item}'`).join(',');


  try {
    // Create a connection to the Oracle database
    connection = await oracledb.getConnection();

    // PL/SQL anonymous block to insert values into the ELIGIBILITY VARRAY
    const plsqlBlock = `
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
      name: newEntry.NAME,
      location: newEntry.LOCATION,
      link: newEntry.LINK,
      amount: newEntry.AMOUNT,
      about: newEntry.DESCRIPTION,
      free: newEntry.FREE,
      deadline: newEntry.DEADLINE,
    };

    // Execute the PL/SQL block
    await connection.execute(plsqlBlock, binds, { autoCommit: true });

  } catch (error) {
    // Check if the error is due to a duplicate entry
    if (error.errorNum === 1 && error.sqlState === '23000') {
      console.log('Duplicate entry: ignoring error.');
    } else {
      console.error('Error inserting into GRANTOPPORTUNITIES table:', error);
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

module.exports.enqueueGrantOpportunityMain = enqueueGrantOpportunityMain;


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

async function getGrantOpportunity(id) {
  let connection;

  try {
    // Create a connection to the Oracle database
    connection = await oracledb.getConnection();

    // PL/SQL anonymous block to insert values into the ELIGIBILITY VARRAY
    const plsqlBlock = `SELECT * FROM USERSUBMITTEDGRANTS WHERE ID = :id FETCH FIRST 1 ROW ONLY`;

    // Bind the input values to the PL/SQL block
    const binds = {
      id: id
    };

    // Execute the PL/SQL block
    const retval = await connection.execute(plsqlBlock, binds, { autoCommit: true });
    return retval;
  } catch (error) {
    // Check if the error is due to a duplicate entry
    if (error.errorNum === 1 && error.sqlState === '23000') {
      console.log('Duplicate entry: ignoring error.');
    } else {
      console.error(`Error finding grant with id: ${id}`, error);
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

module.exports.getGrantOpportunity = getGrantOpportunity;

async function updateGrantInDatabase(grant) {
  let connection;

  try {
    connection = await oracledb.getConnection();

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

    const options = { autoCommit: true };

    const result = await connection.execute(sql, binds, options);

    console.log('Rows updated:', result.rowsAffected);

  } catch (error) {
    console.error('Error updating grant in database:', error);

  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}


module.exports.updateGrantInDatabase = updateGrantInDatabase;