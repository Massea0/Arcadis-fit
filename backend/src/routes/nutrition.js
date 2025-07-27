// Routes pour la gestion de la nutrition
const express = require('express');
const nutritionController = require('../controllers/nutritionController');
const {
  authenticateToken,
  requirePhoneVerification
} = require('../middleware/auth');
const {
  validatePagination,
  validateUUIDParam
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);
router.use(requirePhoneVerification);

// Validation pour l'ajout d'un repas
const validateMeal = [
  body('meal_type')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('Type de repas invalide'),
  body('meal_name')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Le nom du repas est requis (max 255 caractères)'),
  body('meal_date')
    .optional()
    .isISO8601()
    .withMessage('Format de date invalide'),
  body('calories')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Les calories doivent être entre 0 et 10000'),
  body('proteins_g')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Les protéines doivent être entre 0 et 1000g'),
  body('carbs_g')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Les glucides doivent être entre 0 et 1000g'),
  body('fats_g')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Les lipides doivent être entre 0 et 1000g'),
  body('mood_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La note d\'humeur doit être entre 1 et 5'),
  body('hunger_before')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Le niveau de faim doit être entre 1 et 10'),
  body('satisfaction_after')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Le niveau de satisfaction doit être entre 1 et 10')
];

// Validation pour l'analyse d'aliments
const validateFoodAnalysis = [
  body('image_url')
    .optional()
    .isURL()
    .withMessage('URL d\'image invalide'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Description trop longue (max 1000 caractères)')
];

/**
 * @route POST /api/nutrition/meals
 * @desc Ajouter un repas au journal nutritionnel
 * @access Private
 */
router.post('/meals', validateMeal, nutritionController.logMeal);

/**
 * @route GET /api/nutrition/meals
 * @desc Obtenir l'historique nutritionnel
 * @access Private
 */
router.get('/meals', validatePagination, nutritionController.getNutritionHistory);

/**
 * @route GET /api/nutrition/stats
 * @desc Obtenir les statistiques nutritionnelles
 * @access Private
 */
router.get('/stats', nutritionController.getNutritionStats);

/**
 * @route POST /api/nutrition/analyze
 * @desc Analyser un aliment avec l'IA
 * @access Private
 */
router.post('/analyze', validateFoodAnalysis, nutritionController.analyzeFood);

/**
 * @route GET /api/nutrition/recommendations
 * @desc Obtenir des recommandations nutritionnelles personnalisées
 * @access Private
 */
router.get('/recommendations', nutritionController.getNutritionRecommendations);

/**
 * @route PUT /api/nutrition/meals/:mealId
 * @desc Mettre à jour un repas
 * @access Private
 */
router.put('/meals/:mealId', 
  validateUUIDParam('mealId'),
  validateMeal,
  nutritionController.updateMeal
);

/**
 * @route DELETE /api/nutrition/meals/:mealId
 * @desc Supprimer un repas
 * @access Private
 */
router.delete('/meals/:mealId',
  validateUUIDParam('mealId'),
  nutritionController.deleteMeal
);

/**
 * @route GET /api/nutrition/health
 * @desc Health check pour le service nutrition
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service nutrition opérationnel',
    timestamp: new Date().toISOString(),
    features: [
      'Journal alimentaire',
      'Analyse nutritionnelle',
      'Recommandations IA',
      'Statistiques personnalisées',
      'Calcul métabolisme de base'
    ]
  });
});

module.exports = router;