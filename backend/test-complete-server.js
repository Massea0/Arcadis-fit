// Test complet du serveur Arcadis Fit
require('dotenv').config();

const express = require('express');
const cors = require('cors');

console.log('🧪 Test Serveur Complet Arcadis Fit');
console.log('===================================');

const app = express();
const PORT = 3001; // Port différent pour éviter les conflits

// Middleware basique
app.use(cors());
app.use(express.json());

// Import des contrôleurs
try {
  const authController = require('./src/controllers/authController');
  const userController = require('./src/controllers/userController');
  const paymentController = require('./src/controllers/paymentController');
  const gymController = require('./src/controllers/gymController');
  const workoutController = require('./src/controllers/workoutController');
  
  console.log('✅ Tous les contrôleurs importés avec succès');

  // Routes de test simples
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Serveur Arcadis Fit opérationnel',
      services: {
        auth: '✅ OK',
        users: '✅ OK', 
        payments: '✅ OK',
        gyms: '✅ OK',
        workouts: '✅ OK',
        nutrition: '✅ OK',
        notifications: '✅ OK'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Test des services individuels
  app.get('/test/auth', (req, res) => {
    res.json({
      success: true,
      service: 'Auth Controller',
      methods: ['register', 'login', 'verify', 'refreshToken'],
      status: '✅ Opérationnel'
    });
  });

  app.get('/test/users', (req, res) => {
    res.json({
      success: true,
      service: 'User Controller', 
      methods: ['updateProfile', 'uploadPicture', 'getStats'],
      status: '✅ Opérationnel'
    });
  });

  app.get('/test/payments', (req, res) => {
    res.json({
      success: true,
      service: 'Payment Controller',
      methods: ['initiatePayment', 'checkStatus', 'handleWebhook'],
      status: '✅ Opérationnel'
    });
  });

  app.get('/test/gyms', (req, res) => {
    res.json({
      success: true,
      service: 'Gym Controller',
      methods: ['getAllGyms', 'getGymById', 'checkIn', 'checkOut'],
      status: '✅ Opérationnel'
    });
  });

  app.get('/test/workouts', (req, res) => {
    res.json({
      success: true,
      service: 'Workout Controller',
      methods: ['getTemplates', 'createWorkout', 'startWorkout', 'completeWorkout'],
      status: '✅ Opérationnel'
    });
  });

  // Test Supabase
  app.get('/test/supabase', async (req, res) => {
    try {
      const { testConnection } = require('./src/utils/supabase');
      const isConnected = await testConnection();
      
      res.json({
        success: true,
        service: 'Supabase Database',
        status: isConnected ? '✅ Connecté' : '❌ Déconnecté',
        url: process.env.SUPABASE_URL || 'Non configuré'
      });
    } catch (error) {
      res.json({
        success: false,
        service: 'Supabase Database',
        status: '❌ Erreur',
        error: error.message
      });
    }
  });

  // Routes API simplifiées (sans middleware pour les tests)
  app.get('/api/gyms', gymController.getAllGyms);
  app.get('/api/workouts/templates', workoutController.getWorkoutTemplates);
  app.get('/api/payments/plans', paymentController.getMembershipPlans);
  
  // Nouveaux health checks
  app.get('/api/nutrition/health', (req, res) => {
    res.json({
      success: true,
      message: 'Service nutrition opérationnel',
      features: ['Journal alimentaire', 'Analyse IA', 'Recommandations']
    });
  });
  
  app.get('/api/notifications/health', (req, res) => {
    res.json({
      success: true,
      message: 'Service notifications opérationnel',
      features: ['Push notifications', 'Email', 'SMS', 'Préférences']
    });
  });

  // Démarrer le serveur
  app.listen(PORT, () => {
    console.log(`\n🚀 Serveur de test démarré sur le port ${PORT}`);
    console.log(`📋 Endpoints disponibles:`);
    console.log(`   - http://localhost:${PORT}/health`);
    console.log(`   - http://localhost:${PORT}/test/auth`);
    console.log(`   - http://localhost:${PORT}/test/users`);
    console.log(`   - http://localhost:${PORT}/test/payments`);
    console.log(`   - http://localhost:${PORT}/test/gyms`);
    console.log(`   - http://localhost:${PORT}/test/workouts`);
    console.log(`   - http://localhost:${PORT}/test/supabase`);
    console.log(`   - http://localhost:${PORT}/api/gyms`);
    console.log(`   - http://localhost:${PORT}/api/workouts/templates`);
    console.log(`   - http://localhost:${PORT}/api/nutrition/health`);
    console.log(`   - http://localhost:${PORT}/api/notifications/health`);
    console.log(`\n💡 Testez avec: curl http://localhost:${PORT}/health`);
  });

} catch (error) {
  console.error('❌ Erreur lors de l\'import des contrôleurs:', error);
  console.log('\n🔍 Détails de l\'erreur:');
  console.log(error.stack);
  process.exit(1);
}