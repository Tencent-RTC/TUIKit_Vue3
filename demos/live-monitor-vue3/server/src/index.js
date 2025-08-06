const express = require('express');
const { apiRouter } = require('./routes/index.js');
const processCors = require('./middleware/processCors.js');
const { Config } = require('../config/index.js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(processCors);
app.use('/api', apiRouter);

app.listen(Config.Port, err => {
  if (!!err) {
    console.error(err);
  } else {
    console.log('Express server started on port: ' + Config.Port.toString());
  }
});
