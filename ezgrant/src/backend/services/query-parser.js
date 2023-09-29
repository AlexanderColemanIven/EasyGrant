const oracledb = require('oracledb');

const SCHEMA = "ADMIN"
const TABLE = "GRANTS"


function parse_input(user_input){
  if(user_input){
    let phrases = user_input.trim().toUpperCase().replace(/\bAND\b/g, '').match(/\w+|"[^"]+"/g), i = phrases.length;
    while(i--){
      phrases[i] = phrases[i].replace(/"/g,"").trim();
    }
    return phrases;
  } else {
    return [];
  }
}


function get_binds(user_query){
    phrases = parse_input(user_query);
    const bind_array = phrases.map((value, idx) => {
      let bind = {}
      bind[`keyword${idx}`] = { dir: oracledb.BIND_IN, val: `%${value}%`, type: oracledb.STRING }
      return bind;
    });
    const binds = bind_array.reduce((accumulator, currentObject) => {
      // Extract the key from the current object
      const key = Object.keys(currentObject)[0];
      // Merge the current object into the accumulator with the extracted key
      accumulator[key] = currentObject[key];
      return accumulator;
    }, {});
    return binds;
}

module.exports.get_binds = get_binds;


const conditional_and = () => { return ` AND `; }
const conditional_or = () => { return ` OR `; }
const inflectional = (column, value) => { return `UPPER(${column}) LIKE :keyword${value}` }


function generate_query(user_query){
  const columnsToCheck = ['name', 'location', 'about', 'eligibility'];
  
  let phrases = parse_input(user_query);
  if(phrases.length === 0){
    return `SELECT 1 FROM DUAL WHERE 1 = 0`; // do nothing
  }
  const sqlConditions = phrases.map((keyword, idx) => {
    const delimeter = idx === 0 ? `(` : keyword === "OR" 
    ? `)` + conditional_or() + '(' 
    : `)` + conditional_and() + '('
    return delimeter + columnsToCheck.map(column => {
      return inflectional(column, idx);
    }).join(conditional_or());
  }).join('').trim() + ')';
  
  const sqlStatement = `SELECT * FROM ${SCHEMA}.${TABLE} WHERE ${sqlConditions}`;
  console.log(sqlStatement);
  return sqlStatement;
}

module.exports.generate_query = generate_query;