const bcrypt = require("bcryptjs");
const { HASH_SALT } = require("../config/envVariables");

const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, HASH_SALT);
  return hashedPassword;
};

const comparePassword = async (password, hashedPassword) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

module.exports = {
  hashPassword,
  comparePassword,
};
