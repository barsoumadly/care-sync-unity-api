const corsOptions = {
  origin: /^https?:\/\/([\w\-]+\.)*caresyncunity\.live$/,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: '*',
  allowedHeaders: '*',
  exposedHeaders: '*'
};

module.exports = corsOptions;