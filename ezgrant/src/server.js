const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/hello', (req, res) => {
  res.send({ express: 'Hello From Express' });
});

app.post('/api/world', (req, res) => {
  console.log(req.body);
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.post}`,
  );
});

app.listen(port, () => console.log(`Listening on port ${port}`));

async function run() {
    try{
    let connection = await oracledb.getConnection({
    user : "ADMIN",
    password : "Bucknell17837",
    connectString : "(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.us-ashburn-1.oraclecloud.com))(connect_data=(service_name=g2751c4161aebe7_ezgrantdatabase_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))" // [hostname]:[port]/[DB service name]
    });
    let query = 'SELECT * from person';
    const data = await connection.execute(query);
    console.log(data);
    }catch(error){
        console.log(error);
    }
    
}

run();