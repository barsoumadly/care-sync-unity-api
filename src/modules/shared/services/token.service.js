const { tokenConfig } = require("../../../config/envVariables");
const tokenUtils = require("../../../utils/Token");

module.exports = {
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
};
