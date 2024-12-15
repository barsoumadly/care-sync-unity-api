module.exports = function urlGenerator(req, path) {
  return `${req.protocol}://${req.get("host")}${req.baseUrl}/${path}`;
};
