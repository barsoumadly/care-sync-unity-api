const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: "*",
  allowedHeaders: "*",
  exposedHeaders: "*",
};

module.exports = corsOptions;
