const dotenv = require("dotenv");

dotenv.config();

const envVariables = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI,
  HASH_SALT: +process.env.HASH_SALT || 8,
  TOKEN_SIGNATURE: process.env.TOKEN_SIGNATURE || "this is a default signature",
  TOKEN_EXPIRE_TIME: process.env.TOKEN_EXPIRE_TIME || "1m",
};

module.exports = envVariables;
