const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config({path : '../app/build-resource/wallet/.env'});
const dbConnect = require('./services/database-services');

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/hello', async (req, res) => {
  await dbConnect.initialize().then(async () => {
    const sql = `SELECT CURRENT_DATE FROM dual WHERE :b = 1`;
    const binds = [1];
    const options = { outFormat: null };

    res.send({express: await dbConnect.simpleExecute(sql, binds, options)});
  });
  
});

app.post('/api/world', (req, res) => {
  console.log(req.body);
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.post}`,
  );
});

app.listen(port, () => console.log(`Listening on port ${port}`));