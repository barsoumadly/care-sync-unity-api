const express = require("express");
const connectToDatabase = require("./config/database/connectToDatabase");
const envVariables = require("./config/envVariables");

const { StatusCodes } = require("http-status-codes");

const app = express();
const port = envVariables.PORT;

app.use(express.json());

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, "Not found"));
});

app.listen(envVariables.PORT, async () => {
  try {
    await connectToDatabase();
    console.log(`App is running on port: ${port}`);
  } catch (error) {
    console.log(error.message);
  }
});
