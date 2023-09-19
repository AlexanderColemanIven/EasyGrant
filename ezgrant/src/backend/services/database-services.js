Error.stackTraceLimit = 50;
require('dotenv').config({path : '../../../app/build-resource/wallet/.env'});
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
    return (result);
  } catch (err) {
    console.error(err);
    throw (err);
  } finally {
    if (conn) { // conn assignment worked, need to close
      try {
        await conn.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

module.exports.simpleExecute = simpleExecute;