/*
This does nothing rn but eventually we want to connect to database
so we are gonna need a server connection, here im using express js
but we can use something else if it works better for the project

*/

const express = require('express');
const app = express();
const port = 8080; //listening port


//api get request
app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
});