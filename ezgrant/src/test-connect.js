Error.stackTraceLimit = 50;
require('dotenv').config({path : '../app/build-resource/wallet/.env'});
const oracledb = require('oracledb');
const dbConfig = require('../config/dbconfig.js');


console.log(dbConfig.user);

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
      await oracledb.createPool({
        user: dbConfig.user,
        password: dbConfig.password,
        connectString: dbConfig.connectString,
        // TODO: There are a lot of other param options here to explore 
      });
      console.log('Connection pool started');
  
      // Now the pool is running, it can be used
      await dostuff();
  
    } catch (err) {
      console.error('init() error: ' + err.message);
    } finally {
      await closePoolAndExit();
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
      // oracledb.getPool().logStatistics(); // show pool statistics.  pool.enableStatistics must be true
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          // Put the connection back in the pool
          await connection.close();
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
  
  async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
      // Get the pool from the pool cache and close it when no
      // connections are in use, or force it closed after 10 seconds.
      await oracledb.getPool().close(10);
      console.log('Pool closed');
      process.exit(0);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  }
  
  process
    // honest to god I have no idea what these really do 
    // but its req as per the documentation
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT',  closePoolAndExit);
  
  init();
  
  //run();