const corsOptions = {
  origin: (origin, callback) => {
    // Allow any origin (both http and https)
    callback(null, true);
  },
  methods: "*",
  allowedHeaders: "*",
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

module.exports = corsOptions;
