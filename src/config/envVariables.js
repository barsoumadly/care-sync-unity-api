const dotenv = require("dotenv");

dotenv.config();

const envVariables = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI,
  HASH_SALT: +process.env.HASH_SALT || 8,
  tokenConfig: {
    AUTH_SIGNATURE: process.env.AUTH_TOKEN_SIGNATURE || "signature",
    REFRESH_SIGNATURE: process.env.REFRESH_TOKEN_SIGNATURE || "signature",
    EMAIL_VERIFICATION_SIGNATURE:
      process.env.EMAIL_VERIFICATION_TOKEN_SIGNATURE || "signature",
    AUTH_EXPIRE_TIME: process.env.AUTH_EXPIRE_TIME || "30d",
    EMAIL_VERIFICATION_EXPIRE_TIME:
      process.env.EMAIL_VERIFICATION_EXPIRE_TIME || "1h",
    PASSWORD_RESET_EXPIRE_TIME: process.env.PASSWORD_RESET_EXPIRE_TIME || "15m",
  },
  emailConfig: {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USERNAME: process.env.SMTP_USERNAME,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  },
};

module.exports = envVariables;
