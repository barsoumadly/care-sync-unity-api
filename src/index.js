const express = require("express");
const cors = require("cors");
const { StatusCodes } = require("http-status-codes");

// Configuration imports
const corsOptions = require("./config/cors");
const envVariables = require("./config/envVariables");
const sslConfig = require("./config/ssl");

// Middleware and utilities
const ApiError = require("./utils/ApiError");
const globalErrorHandler = require("./middlewares/errorHandler");
const connectToDatabase = require("./config/database/connectToDatabase");

// Chat service for Socket.IO
const chatService = require("./modules/chat/chat.service");

// Routes
const indexRouter = require("./routes/index.routes");

const createServer = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(cors(corsOptions));
  
  // Routes
  app.use("/api/v1", indexRouter);
  
  // 404 handler
  app.use((req, res, next) => {
    next(new ApiError("Endpoint Not found", StatusCodes.NOT_FOUND));
  });
  
  // Error handler
  app.use(globalErrorHandler);
  
  // Create HTTP/HTTPS server based on SSL config
  if (sslConfig.isEnabled) {
    return require("https").createServer(sslConfig.options, app);
  }
  return require("http").createServer(app);
};

const startServer = async () => {
  const server = createServer();
  const port = envVariables.PORT;

  try {
    chatService.initializeSocketIO(server);
    await connectToDatabase();
    server.listen(port, () => {
      console.log(
        `Server running on ${sslConfig.isEnabled ? 'HTTPS' : 'HTTP'} - port: ${port}`
      );
    });
  } catch (error) {
    console.log("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
