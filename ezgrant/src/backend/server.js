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
    console.log(features);
    const sql = qp.generate_query(features);
   const binds = qp.get_binds(features);
    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const retval = await connection.execute(sql, binds, options);
    /*
    retval.rows.sort((a, b) => {
      const scoreA = calculateSimilarity(a, features);
      const scoreB = calculateSimilarity(b, features);

      // Compare scores for sorting
      if (scoreB !== scoreA) {
          return scoreB - scoreA; // Sort by custom score
      }
      // If scores are equal, perform secondary sort based on AMOUNT
      return parseInt(b.AMOUNT) - parseInt(a.AMOUNT);
      
  });
  */

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

    const eligibilityArray = grant.ELIGIBILITY.map(item => `'${item}'`).join(',');
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
      name: grant.NAME,
      location: grant.LOCATION,
      link: grant.LINK,
      amount: grant.AMOUNT,
      about: grant.ABOUT,
      free: grant.FREE,
      deadline: grant.DEADLINE,
      dateSubmitted: grant.DATESUBMITTED,
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

function calculateScore(row, features) {
  let score = 0;

  // Preprocess location values
  const location = row.LOCATION ? row.LOCATION.toLowerCase() : '';
  const featuresLocation = features.location.toLowerCase();
  const stateMapping = stateMappings[features.location.toUpperCase()];

  if (location) {
    if (location === featuresLocation) {
      score += 2;
      return score;
    } else if (location.includes(featuresLocation) || location.includes(stateMapping)) {
      score += 1;
    }

    if (features.leftoverMatchers.some(tag => location.includes(tag.toUpperCase()))) {
      score += 1;
    }
  }

  if (!row.ELIGIBILITY) {
    return score;
  }

  // Check if eligibility exists before executing regex
  const eligibilityArray = [];
  const regex = /'([^']+)'|(\w+)/g;

  let match;
  while ((match = regex.exec(row.ELIGIBILITY)) !== null) {
    const value = (match[1] || match[2])?.toUpperCase();
    if (value) {
      eligibilityArray.push(value);
    }
  }

  // Use sets for faster lookup
  const tagsSet = new Set(features.tags);
  const leftoverMatchersSet = new Set(features.leftoverMatchers);

  // Increase score for matching tags with eligibility
  for (const eligibilityTag of eligibilityArray) {
    if (tagsSet.has(eligibilityTag)) {
      score += 1;
    }
    if (leftoverMatchersSet.has(eligibilityTag)) {
      score += 1;
    }
  }

  return score;
}

const stateMappings = {
  'ALABAMA': 'AL',
  'ALASKA': 'AK',
  'ARIZONA': 'AZ',
  'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA',
  'COLORADO': 'CO',
  'CONNECTICUT': 'CT',
  'DELAWARE': 'DE',
  'FLORIDA': 'FL',
  'GEORGIA': 'GA',
  'HAWAII': 'HI',
  'IDAHO': 'ID',
  'ILLINOIS': 'IL',
  'INDIANA': 'IN',
  'IOWA': 'IA',
  'KANSAS': 'KS',
  'KENTUCKY': 'KY',
  'LOUISIANA': 'LA',
  'MAINE': 'ME',
  'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA',
  'MICHIGAN': 'MI',
  'MINNESOTA': 'MN',
  'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO',
  'MONTANA': 'MT',
  'NEBRASKA': 'NE',
  'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  'OHIO': 'OH',
  'OKLAHOMA': 'OK',
  'OREGON': 'OR',
  'PENNSYLVANIA': 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  'TENNESSEE': 'TN',
  'TEXAS': 'TX',
  'UTAH': 'UT',
  'VERMONT': 'VT',
  'VIRGINIA': 'VA',
  'WASHINGTON': 'WA',
  'WEST VIRGINIA': 'WV',
  'WISCONSIN': 'WI',
  'WYOMING': 'WY'
};

function calculateSimilarity(row, features) {
  // Define weights for each feature
  const weights = {
    location: 2,
    tags: 1,
    leftovers: 1,
    amount: 1,
    // Add more features and weights as needed
  };

  const featureMapping = {
    location: 'LOCATION',
    tags: 'ELIGIBILITY',
    amount: 'AMOUNT'
  }

  let totalWeight = 0;
  let totalScore = 0;

  // Calculate similarity for each feature and aggregate the total score
  for (const feature in weights) {
    const weight = weights[feature];
    totalWeight += weight;

    if (features.hasOwnProperty(feature) && row.hasOwnProperty(featureMapping[feature])) {
      if(featureMapping[feature] === 'ELIGIBILITY'){
        const eligibilityArray = [];
        const regex = /'([^']+)'|(\w+)/g;

        let match;
        while ((match = regex.exec(row.ELIGIBILITY)) !== null) {
          const value = (match[1] || match[2])?.toUpperCase();
          if (value) {
            eligibilityArray.push(value);
          }
        }
        const featureScore = calculateFeatureSimilarity(features[feature].concat(features.leftoverMatchers), eligibilityArray);
        totalScore += weight * featureScore;
      }else{
        const featureScore = calculateFeatureSimilarity(features[feature], row[featureMapping[feature]]);
        totalScore += weight * featureScore;
      }
    }
  }

  // Normalize the total score by the total weight
  const similarityScore = totalScore / totalWeight;
  //console.log(similarityScore, "for:", row.NAME);
  return similarityScore;
}

function calculateFeatureSimilarity(featureA, featureB) {
  // Implement similarity calculation for each feature type
  // For example, for strings, you might use Jaccard similarity or other string similarity metrics
  // For numeric values, you might use a normalized difference or other appropriate metric

  // Placeholder implementation - replace with appropriate similarity calculation
  if (typeof featureA === 'string' && typeof featureB === 'string') {
    return 0;
  } else if (typeof featureA === 'number' && typeof featureB === 'number') {
    return numericSimilarity(featureA, featureB);
  } else if (Array.isArray(featureA) && Array.isArray(featureB)){
    return arrSimilarity(featureA, featureB);
  } else {
    // Handle other types of features as needed
    return 0;
  }
}

// Example string similarity function (replace with an appropriate implementation)
function stringSimilarity(strA, strB) {
  // Jaccard similarity for strings
  const setA = new Set(strA.split(''));
  const setB = new Set(strB.split(''));

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

function numericSimilarity(numA, numB) {
  // Example: Normalized difference for numeric values
  const range = Math.max(numA, numB) - Math.min(numA, numB);
  return range > 0 ? 1 / range : 1;
}

function arrSimilarity(arr1, arr2) {
  // Using Jaccard similiarity coeff
  const set1 = new Set(arr1.map(item => item.toLowerCase()));
  const set2 = new Set(arr2.map(item => item.toLowerCase()));

  const intersectionSize = [...set1].filter(item => set2.has(item)).length;
  const unionSize = set1.size + set2.size - intersectionSize;

  return unionSize > 0 ? (intersectionSize / unionSize): 0;
}