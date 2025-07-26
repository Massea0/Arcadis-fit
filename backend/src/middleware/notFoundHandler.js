// Middleware pour gérer les routes non trouvées
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} non trouvée`,
    code: 'ROUTE_NOT_FOUND'
  });
};

module.exports = {
  notFoundHandler
};