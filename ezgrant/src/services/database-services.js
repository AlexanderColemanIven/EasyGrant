Error.stackTraceLimit = 50;
require('dotenv').config({path : '../../app/build-resource/wallet/.env'});
const oracledb = require('oracledb');
const dbConfig = require('dbconfig');

console.log(dbConfig.ezgrantPool.user);

function doRelease(connection) {
  connection.release(function (err) {
    if (err) {
      console.error(err.message);
    }
  });
}

async function init() {
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
    try {
      // Create a connection pool which will later be accessed via the
      // pool cache as the 'default' pool.
      await oracledb.createPool(dbConfig.ezgrantPool);
      console.log('Connection pool started');
  
      // Now the pool is running, it can be used
      let retval;
      retval = await dostuff();
      retval = retval ? 'Current date is: ' + retval.rows[0].CURRENT_DATE : 'Nothing found';
      return retval;
  
    } catch (err) {
      console.error('init() error: ' + err.message);
    } 
  }
  
  async function dostuff() {
    let connection;
    try {
      // Get a connection from the default pool
      connection = await oracledb.getConnection();
      const sql = `SELECT CURRENT_DATE FROM dual WHERE :b = 1`;
      const binds = [1];
      const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
      const result = await connection.execute(sql, binds, options);
      console.log(result);
      return result;
      // oracledb.getPool().logStatistics(); // show pool statistics.  pool.enableStatistics must be true
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        doRelease(connection);
      }
    }
  }

module.exports.init = init;