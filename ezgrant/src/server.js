const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config({path : '../app/build-resource/wallet/.env'});
const dbConnect = require('./services/database-services');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dbConnect.close();

app.get('/api/hello', (req, res) => {
  res.send({express: 'Hello!'});
});

app.post('/api/world', async (req, res) => {
  await dbConnect.initialize().then(async () => {
    let sql = `SELECT * FROM GRANTS`;
    const binds = [];
    const options = { outFormat: null };

    let retval = await dbConnect.simpleExecute(sql, binds, options);

    res.send({express: retval[0]});
  });
});

app.listen(port, () => console.log(`Listening on port ${port}`));