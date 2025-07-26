const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Supabase configuration
const { testConnection } = require('./src/config/supabase');

const { logger } = require('./src/utils/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const { notFoundHandler } = require('./src/middleware/notFoundHandler');
const { authenticateUser } = require('./src/middleware/auth');

// Import routes
const authRoutes = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    supabase: 'connected'
  });
});

// Test Supabase endpoint
app.get('/api/test-supabase', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      success: true,
      message: 'Test de connexion Supabase',
      connected: isConnected
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur de test Supabase',
      details: error.message
    });
  }
});

// API routes - pour l'instant seulement auth
app.use('/api/auth', authRoutes);

// Route protégée de test
app.get('/api/test-auth', authenticateUser, (req, res) => {
  res.json({
    success: true,
    message: 'Authentification réussie !',
    user: {
      id: req.user.id,
      email: req.user.email,
      profile: req.profile
    }
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt gracieux du serveur');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt gracieux du serveur');
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejection non gérée:', promise, 'raison:', reason);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Exception non gérée:', error);
  process.exit(1);
});

// Start server
app.listen(PORT, async () => {
  logger.info(`🚀 Serveur Arcadis Fit (version simple) démarré sur le port ${PORT}`);
  logger.info(`🏥 Health check disponible sur http://localhost:${PORT}/health`);
  
  // Test Supabase connection
  const isConnected = await testConnection();
  if (isConnected) {
    logger.info('🗄️  Base de données Supabase connectée avec succès');
  } else {
    logger.error('❌ Impossible de se connecter à Supabase. Vérifiez vos variables d\'environnement.');
  }
  
  logger.info('📋 Endpoints disponibles:');
  logger.info('   GET  /health - Status du serveur');
  logger.info('   GET  /api/test-supabase - Test connexion Supabase');
  logger.info('   POST /api/auth/register - Inscription');
  logger.info('   POST /api/auth/login - Connexion');
  logger.info('   GET  /api/auth/profile - Profil (auth requis)');
  logger.info('   GET  /api/test-auth - Test auth (auth requis)');
});

module.exports = app;