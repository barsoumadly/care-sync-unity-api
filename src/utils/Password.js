const bcrypt = require("bcryptjs");
const { HASH_SALT } = require("../config/envVariables");
const crypto = require("crypto");

const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, HASH_SALT);
  return hashedPassword;
};

const comparePassword = async (password, hashedPassword) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

const generatePassword = (length = 12) => {
  // Define character sets
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Ensure at least one character from each set
  let password = 
    uppercase[crypto.randomInt(uppercase.length)] +
    lowercase[crypto.randomInt(lowercase.length)] +
    numbers[crypto.randomInt(numbers.length)] +
    symbols[crypto.randomInt(symbols.length)];
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

module.exports = {
  hashPassword,
  comparePassword,
  generatePassword,
};
