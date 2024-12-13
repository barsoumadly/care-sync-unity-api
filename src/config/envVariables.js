const dotenv = require("dotenv");

dotenv.config();

const envVariables = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI,
  HASH_SALT: process.env.HASH_SALT || 8,
};

module.exports = envVariables;
