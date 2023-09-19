const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config({path : '../../app/build-resource/wallet/.env'});
const dbConnect = require('./services/database-services');
const oracledb = require('oracledb');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dbConnect.close();  // avoid any pool cache issues

app.get('/api/hello', (req, res) => {
  res.send({express: 'Hello!'});
});

app.post('/api/world', async (req, res) => {
  await dbConnect.initialize().then(async () => {
    let user_query = req.body.post.split(/(?<=^\S+)\s/);
    console.log(user_query);
    let sql = `SELECT * FROM GRANTS WHERE ${user_query[0]}=:id`;
    let binds = {
      //search_param: { dir: oracledb.BIND_IN, val: user_query[0], type: oracledb.STRING },
      id: { dir: oracledb.BIND_IN, val: user_query[1], type: oracledb.STRING }
   };
  
    const options = { outFormat: null };

    let retval = await dbConnect.simpleExecute(sql, binds, options);
    console.log(retval);
    res.send({express: retval});
  });
});

app.listen(port, () => console.log(`Listening on port ${port}`));