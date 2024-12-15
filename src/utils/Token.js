const jwt = require("jsonwebtoken");
const ApiError = require("./ApiError");
const { StatusCodes } = require("http-status-codes");

module.exports = {
  createToken: async (obj = {}, signature, expire_time) => {
    return new Promise((resolve, reject) => {
      jwt.sign(obj, signature, { expiresIn: expire_time }, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  },

  decodeToken: async (token, signature) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, signature, (err, decoded) => {
        if (err) {
          reject(new ApiError("Invalid token", StatusCodes.UNAUTHORIZED));
        } else {
          resolve(decoded);
        }
      });
    });
  },

  verifyToken: async (token, signature) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, signature, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },
};
