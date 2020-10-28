const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('errorhandler');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use(errorHandler());

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is listenting at localhost:${3000}`);
});

module.exports = app;
