const { tokenConfig } = require("../../../config/envVariables");
const tokenUtils = require("../../../utils/Token");

module.exports = {
  generateEmailVerificationToken: async (obj = {}) => {
    return await tokenUtils.createToken(
      obj,
      tokenConfig.EMAIL_VERIFICATION_SIGNATURE,
      tokenConfig.EMAIL_VERIFICATION_EXPIRE_TIME
    );
  },
  generatePasswordResetToken: async (obj = {}) => {
    return await tokenUtils.createToken(
      obj,
      tokenConfig.PASSWORD_RESET_SIGNATURE,
      tokenConfig.PASSWORD_RESET_EXPIRE_TIME
    );
  },
  generateAuthToken: async (obj = {}) => {
    return await tokenUtils.createToken(
      obj,
      tokenConfig.AUTH_SIGNATURE,
      tokenConfig.AUTH_EXPIRE_TIME
    );
  },
  decodeAuthToken: async (token) => {
    return await tokenUtils.decodeToken(token, tokenConfig.AUTH_SIGNATURE);
  },
  decodeEmailVerificationToken: async (token) => {
    return await tokenUtils.decodeToken(
      token,
      tokenConfig.EMAIL_VERIFICATION_SIGNATURE
    );
  },
  decodePasswordResetToken: async (token) => {
    return await tokenUtils.decodeToken(
      token,
      tokenConfig.PASSWORD_RESET_SIGNATURE
    );
  },
};
