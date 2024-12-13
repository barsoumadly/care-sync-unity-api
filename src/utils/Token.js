const jwt = require("jsonwebtoken");
const {
  TOKEN_SIGNATURE,
  TOKEN_EXPIRE_TIME,
} = require("../config/envVariables");

const createToken = (user) => {
  const token = jwt.sign({ id: user._id }, TOKEN_SIGNATURE, {
    expiresIn: TOKEN_EXPIRE_TIME,
  });
  return token;
};

const verifyToken = (token) => {
  // TODO: Implement verifyToken
};

module.exports = {
  createToken,
  verifyToken,
};
