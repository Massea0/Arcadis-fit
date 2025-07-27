const express = require('express');
const workoutController = require('../controllers/workoutController');
const {
  authenticateToken,
  requirePhoneVerification
} = require('../middleware/auth');
const {
  validatePagination,
  validateUUIDParam,
  validateWorkout,
  validateExerciseSet,
  validateWorkoutCompletion,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

// Templates d'entraînement (publics)
router.get('/templates', workoutController.getWorkoutTemplates);

// Routes protégées - Entraînements utilisateur
router.post('/',
  authenticateToken,
  requirePhoneVerification,
  validateWorkout,
  workoutController.createWorkout
);

router.get('/history',
  authenticateToken,
  requirePhoneVerification,
  validatePagination,
  workoutController.getWorkoutHistory
);

router.post('/:workoutId/start',
  authenticateToken,
  requirePhoneVerification,
  validateUUIDParam('workoutId'),
  workoutController.startWorkout
);

router.post('/:workoutId/complete',
  authenticateToken,
  requirePhoneVerification,
  validateUUIDParam('workoutId'),
  validateWorkoutCompletion,
  workoutController.completeWorkout
);

// Gestion des séries d'exercices
router.post('/exercises/:workoutExerciseId/sets',
  authenticateToken,
  requirePhoneVerification,
  validateUUIDParam('workoutExerciseId'),
  validateExerciseSet,
  workoutController.logExerciseSet
);

// Progrès et analytics
router.get('/exercises/:exerciseId/progress',
  authenticateToken,
  requirePhoneVerification,
  validateUUIDParam('exerciseId'),
  validateDateRange,
  workoutController.getExerciseProgress
);

// Recommandations IA
router.get('/ai/recommendations',
  authenticateToken,
  requirePhoneVerification,
  workoutController.getAIRecommendations
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Workout service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;