const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./config/database/connectToDatabase");
const envVariables = require("./config/envVariables");
const ApiError = require("./utils/ApiError");
const { StatusCodes } = require("http-status-codes");
const globalErrorHandler = require("./middlewares/errorHandler");
const indexRouter = require("./routes/index.routes");

const app = express();
const port = envVariables.PORT;

app.use(express.json());
app.use(cors());

app.use("/api/v1", indexRouter);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError("Endpoint Not found", StatusCodes.NOT_FOUND));
});

app.use(globalErrorHandler);

app.listen(envVariables.PORT, async () => {
  try {
    await connectToDatabase();
    console.log(`App is running on port: ${port}`);
  } catch (error) {
    console.log(error.message);
  }
});
