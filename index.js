const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config()

const PORT = process.env.PORT || 5000

const dev = process.env.NODE_ENV !== 'production';
const next = require('next');
const pathMatch = require('path-match');
const app = next({ dev });
const handle = app.getRequestHandler();
const { parse } = require('url');

// const apiRoutes = require('./server/routes/apiRoutes.js');

app.prepare().then(() => {
  const app = express();

  app.use(cors({
    origin: function(origin, callback){
      return callback(null, true);
    },
    optionsSuccessStatus: 200,
    credentials: true
  }))

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))

  app.use(cookieParser())

  app.use('/api', require("./backend/routes/users/index.js"))
  app.use('/api', require("./backend/routes/items/index.js"))
  app.use('/api', require("./backend/routes/comments/index.js"))
  app.use('/api', require("./backend/routes/moderation/index.js"))

  const route = pathMatch();

  app.get('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server ready on http://localhost:${PORT}`);
  });
})