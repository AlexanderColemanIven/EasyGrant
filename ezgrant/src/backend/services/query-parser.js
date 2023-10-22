const oracledb = require('oracledb');
const natural = require('natural');
const nlp = require('compromise');
const adv_nlp = require('compromise/two');

const {
  moreThanExpressions, 
  lessThanExpressions, 
 } = require('./keywords');

const SCHEMA = "ADMIN"
const TABLE = "GRANTS"


function generateSubstrings(inputString) {
  const substrings = [];
  const words = inputString.split(' ').filter(word => word.trim() !== ''); // Filter out empty words
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j <= words.length; j++) {
      const substr = words.slice(i, j).join(' ');
      // Potential titles must have at least one Noun
      if(nlp(substr).has('#Noun')){
        substrings.push(substr)
      }
    }
  }
  return substrings;
}

function containsAnyWord(inputString, wordArray) {
  const regex = new RegExp(wordArray.join("|"), "i");
  return regex.test(inputString);
}

async function extractFeatures(input) {
  input = input.trim().toUpperCase();
  const features = {
    amount: null,
    location: null,
    deadline: null,
    tags: null,
    leftoverMatchers: null,
  }
  let doc_query = nlp(input);

  // Need #Preposition #Date -> Could be before or after
  //Need #Adjective #Preposition #Date -> Due by October 30, Due in October 30
  //Need #Conjuction #Date -> Before September
  console.log(doc_query.match('#Adjective').text());
  console.log(doc_query.match('#Verb').text());
  console.log(doc_query.match('#Adverb').text());
  console.log(doc_query.match('#Noun').text());
  console.log(doc_query.match('#Preposition').text());
  console.log(doc_query.match('#Conjunction').text());

  //Find all possible amount comparisons
  if(doc_query.has('not #Noun #Preposition #Value')){
    features.amount = `>= ${await doc_query.match('not #Noun #Preposition #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('not #Noun #Preposition #Value').text(), "");
  }
  else if(doc_query.has('not #Adverb #Preposition #Value')){
    features.amount = `<= ${await doc_query.match('not #Adverb #Preposition #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('not #Adverb #Preposition #Value').text(), "");
  }
  else if(doc_query.has('not #Adjective #Preposition #Value')){
    const feature = await doc_query.match('not #Adjective #Preposition #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('not #Adjective #Preposition #Value').text(), "");
  }
  else if(doc_query.has('not #Adjective #Value')){
    const feature = await doc_query.match('not #Adjective #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('not #Adjective #Value').text(), "");
  }
  else if(doc_query.has('not #Conjunction #Conjunction #Conjunction #Value')){
    const feature = await doc_query.match('not #Conjunction #Conjunction #Conjunction #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('not #Conjunction #Conjunction #Conjunction #Value').text(), "");
  }
  else if(doc_query.has('#Conjunction #Conjunction #Conjunction #Value')){
    const feature = await doc_query.match('#Conjunction #Conjunction #Conjunction #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('#Conjunction #Conjunction #Conjunction #Value').text(), "");
  }
  else if(doc_query.has('#Adjective #Value')){
    const feature = await doc_query.match('#Adjective #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('#Adjective #Value').text(), "");
  }
  else if(doc_query.has('#Adjective #Preposition #Value')){
    const feature = await doc_query.match('#Adjective #Preposition #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('#Adjective #Preposition #Value').text(), "");
  }
  else if(doc_query.has('#Adverb #Preposition #Value')){
    features.amount = `> ${await doc_query.match('#Adverb #Preposition #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('#Adverb #Preposition #Value').text(), "");
  }
  else if(doc_query.has('#Noun #Preposition #Value')){
    features.amount = `< ${await doc_query.match('#Noun #Preposition #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('#Noun #Preposition #Value').text(), "");
  }
  else if(doc_query.has('at least #Value')){
    features.amount = `> ${await doc_query.match('at least #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('at least #Value').text(), "");
  }

  doc_query = nlp(input);
  features.location = await doc_query.places().text(); // Find location
  console.log(doc_query.text());
  if(doc_query.has('BEFORE #Date')){
    console.log("Got here");
    features.deadline = ['<=', doc_query.match('#Date').text()];
  }
  else if(doc_query.has('AFTER #Date')){
    features.deadline = ['>=', doc_query.match('#Date').text()];
  }else if(doc_query.has('#Date')){
    features.deadline = ['=', doc_query.match('#Date').text()]; // Find due date or date IG
  }
  input = input.replace(features.location, "");
  input = input.replace(features.deadline, "");
  doc_query = nlp(input);

  // Extract potential tags like Dancer, doesnt matter if tags dont make sense, they dont all have to match
  features.tags = doc_query.match('#Noun #Noun? or? and?').text().split(/\s+/).filter(function(word) {
    return word !== "and" && word !== "or" && !nlp(word).places().text() && !nlp(word).match('#Date').text();
  });
  features.leftoverMatchers = generateSubstrings(doc_query.text());
  return features;
}


function parse_input(user_input){
  extractFeatures(user_input).then((retval) => {
    console.log(retval);
  })

  if(user_input){
    let phrases = user_input
    .trim()
    .toUpperCase()
    .replace(/\bAND\b/g, '')
    .match(/[\w-]+|"[^"]+"/g), i = phrases.length;
    while(i--){
      phrases[i] = phrases[i].replace(/"/g,"").trim();
    }
    return phrases;
  } else {
    return [];
  }
}

module.exports.extractFeatures = extractFeatures;


function get_binds(features){
    phrases = features.leftoverMatchers;
    const bind_array = phrases.map((value, idx) => {
      if(value.charAt(0) === '-'){
        value = value.substring(1);
      }
      let bind = {}
      bind[`keyword${idx}`] 
      = { dir: oracledb.BIND_IN, val: `%${value}%`, type: oracledb.STRING }
      return bind;
    });
    const binds = bind_array.reduce((accumulator, currentObject) => {
      // Extract the key from the current object
      const key = Object.keys(currentObject)[0];
      // Merge the current object into the accumulator with the extracted key
      accumulator[key] = currentObject[key];
      return accumulator;
    }, {});

    if(features.amount){
      const regex = /([><=]+)\s*([\d.]+)/;
      const match = features.amount.match(regex);
      binds.amount = { dir: oracledb.BIND_IN, val: parseFloat(match[2]), type: oracledb.NUMBER }
    }
    if(features.location){
      binds.location = { dir: oracledb.BIND_IN, val: `%${features.location}%`, type: oracledb.STRING }
    }
    if(features.deadline){
      binds.deadline = { dir: oracledb.BIND_IN, val: `%${features.deadline[1]}%`, type: oracledb.STRING }
    }
    return binds;
}

module.exports.get_binds = get_binds;


const conditional_and = () => { return ` AND `; }
const conditional_or = () => { return ` OR `; }
const variable_delimeter = (conditional) => { return ')' + conditional + '(' }
const inflectional = (column, value) => { return `UPPER(${column}) LIKE :keyword${value}` }
const negate_inflectional = (column, value) => { return `UPPER(${column}) NOT LIKE :keyword${value}` }


function generate_query(features){
  let restrictives = [];
  if (features.amount){
    const regex = /([><=]+)\s*([\d.]+)/;
    const match = features.amount.match(regex);
    restrictives.push(`AMOUNT IS NOT NULL 
    AND TO_NUMBER(REGEXP_REPLACE(AMOUNT, '[^0-9]+', '')) ${match[1]} :amount`);
  }
  if (features.location){
    restrictives.push(`UPPER(LOCATION) LIKE :location`);
  }
  if (features.deadline){
    if (features.deadline[0] === '='){
      restrictives.push(`UPPER(DEADLINE) LIKE :deadline`);
    }else{
      restrictives.push(`TO_DATE(UPPER(DEADLINE), 'YYYY-MM-DD') ${features.deadline[0]} TO_DATE(:deadline , 'YYYY-MM-DD')`);
    }
    
  }
  const preQuery = restrictives.length > 0 ? restrictives.join(' AND ') : "";
  console.log(preQuery);

  const columnsToCheck = ['name', 'about'];
  
  const sqlConditions = features.leftoverMatchers.length > 0 ? features.leftoverMatchers.map((keyword, idx) => {
    const delimeter = idx === 0 ? `(` : keyword === "OR"
    ? variable_delimeter(conditional_or())
    : variable_delimeter(conditional_and());
    if(keyword.charAt(0) === '-'){ // handle exclusion
      return delimeter + columnsToCheck.map(column => {
        return negate_inflectional(column, idx);
      }).join(conditional_and());
    }
    return delimeter + columnsToCheck.map(column => {
      return inflectional(column, idx);
    }).join(conditional_or());
  }).join('') + ')' : '';
  if(preQuery && !sqlConditions){
    const sqlStatement = `SELECT * FROM ${SCHEMA}.${TABLE} WHERE ${preQuery}`;
    return sqlStatement;
  }
  if(!preQuery && sqlConditions){
    const sqlStatement = `SELECT * FROM ${SCHEMA}.${TABLE} WHERE ${sqlConditions}`;
    return sqlStatement;
  }
  if(!preQuery && !sqlConditions){
    const sqlStatement = `SELECT 1 FROM DUAL WHERE 1 = 0`;
    return sqlStatement;
  }
  
  const sqlStatement = `SELECT * FROM ${SCHEMA}.${TABLE} WHERE ${preQuery} OR ${sqlConditions}`;
  return sqlStatement;
  
}

module.exports.generate_query = generate_query;