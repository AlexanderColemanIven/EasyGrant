const express = require('express');
const bodyParser = require('body-parser');
const dbConnect = require('./services/database-services');
const qp = require('./services/query-parser');


const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => console.log(`Listening on port ${port}`));

dbConnect.close();  // avoid any pool cache issues

app.post('/api/database', async (req, res) => {
  await dbConnect.initialize().then(async () => {
    let sql = qp.generate_query();
    let binds = qp.get_binds(req.body.post);
    const options = { outFormat: null };

    let retval = await dbConnect.simpleExecute(sql, binds, options);
    console.log(retval);
    res.send({express: retval});
  });
});