const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config({path : '../../app/build-resource/wallet/.env'});
const dbConnect = require('./services/database-services');
const oracledb = require('oracledb');


const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => console.log(`Listening on port ${port}`));

dbConnect.close();  // avoid any pool cache issues

app.post('/api/database', async (req, res) => {
  await dbConnect.initialize().then(async () => {
    let user_query = req.body.post.split(/(?<=^\S+)\s/);
    console.log(user_query);
    let sql = `SELECT * FROM GRANTS WHERE ${user_query[0]}=:id`;
    let binds = {
      id: { dir: oracledb.BIND_IN, val: user_query[1], type: oracledb.STRING }
   };
  
    const options = { outFormat: null };

    let retval = await dbConnect.simpleExecute(sql, binds, options);
    console.log(retval);
    res.send({express: retval});
  });
});

