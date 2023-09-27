const oracledb = require('oracledb');
const SCHEMA = "ADMIN"
const TABLE = "GRANTS"

function generate_query(){
    const columnsToCheck = ['name', 'location', 'about', 'eligibility'];

    const sqlConditions = columnsToCheck.map(column => {
        return `UPPER(${column}) LIKE :keywords`;
      });
    
    const sqlStatement = `
      SELECT *
      FROM ${SCHEMA}.${TABLE}
      WHERE ${sqlConditions.join(' OR ')}
    `;

    return sqlStatement
}

module.exports.generate_query = generate_query;

function get_binds(user_query){
    user_query = user_query.replace(/\s+/g,' ').trim().toUpperCase();
    return {keywords: { dir: oracledb.BIND_IN, val: `%${user_query}%`, type: oracledb.STRING }}
}

module.exports.get_binds = get_binds;