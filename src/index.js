const express = require("express");
const connectToDatabase = require("./config/database/connectToDatabase");
const envVariables = require("./config/envVariables");

const app = express();
const port = envVariables.PORT;

app.listen(async () => {
  try {
    await connectToDatabase();
    console.log(`App is running on port: ${port}`);
  } catch (error) {
    console.log(error.message);
  }
});
