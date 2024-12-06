const dotenv = require("dotenv");

dotenv.config();

const envVariables = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI,
};

module.exports = envVariables;
