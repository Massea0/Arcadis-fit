const { body, param, query, validationResult } = require('express-validator');
const { 
  validateEmail, 
  validatePhoneNumber, 
  validatePassword,
  validateFullName,
  validateAge,
  validateFitnessLevel,
  validateFitnessGoals,
  validateGender,
  validateVerificationCode,
  validateUUID
} = require('../utils/validation');
const logger = require('../utils/logger');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation errors', {
      errors: errorMessages,
      ip: req.ip,
      endpoint: req.originalUrl
    });

    return res.status(400).json({
      success: false,
      error: 'Erreurs de validation',
      details: errorMessages
    });
  }

  next();
};

/**
 * Registration validation middleware
 */
const validateRegistration = [
  body('email')
    .notEmpty()
    .withMessage('Email requis')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .custom((value) => {
      if (!validateEmail(value)) {
        throw new Error('Format d\'email invalide');
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .custom((value) => {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),

  body('fullName')
    .notEmpty()
    .withMessage('Nom complet requis')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères')
    .custom((value) => {
      if (!validateFullName(value)) {
        throw new Error('Format de nom invalide');
      }
      return true;
    }),

  body('phoneNumber')
    .notEmpty()
    .withMessage('Numéro de téléphone requis')
    .custom((value) => {
      if (!validatePhoneNumber(value)) {
        throw new Error('Numéro de téléphone sénégalais invalide. Format: +221XXXXXXXXX');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Login validation middleware
 */
const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email requis')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis'),

  handleValidationErrors
];

/**
 * Phone verification validation middleware
 */
const validatePhoneVerification = [
  body('userId')
    .notEmpty()
    .withMessage('ID utilisateur requis')
    .custom((value) => {
      if (!validateUUID(value)) {
        throw new Error('Format d\'ID utilisateur invalide');
      }
      return true;
    }),

  body('phoneNumber')
    .notEmpty()
    .withMessage('Numéro de téléphone requis')
    .custom((value) => {
      if (!validatePhoneNumber(value)) {
        throw new Error('Numéro de téléphone invalide');
      }
      return true;
    }),

  body('code')
    .notEmpty()
    .withMessage('Code de vérification requis')
    .isLength({ min: 6, max: 6 })
    .withMessage('Le code doit contenir exactement 6 chiffres')
    .isNumeric()
    .withMessage('Le code doit être numérique')
    .custom((value) => {
      if (!validateVerificationCode(value)) {
        throw new Error('Format de code de vérification invalide');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Profile update validation middleware
 */
const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères')
    .custom((value) => {
      if (value && !validateFullName(value)) {
        throw new Error('Format de nom invalide');
      }
      return true;
    }),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Format de date invalide')
    .custom((value) => {
      if (value) {
        const ageValidation = validateAge(value);
        if (!ageValidation.isValid) {
          throw new Error(ageValidation.error);
        }
      }
      return true;
    }),

  body('gender')
    .optional()
    .custom((value) => {
      if (value && !validateGender(value)) {
        throw new Error('Genre invalide');
      }
      return true;
    }),

  body('heightCm')
    .optional()
    .isFloat({ min: 100, max: 250 })
    .withMessage('Taille invalide (100-250 cm)'),

  body('heightFt')
    .optional()
    .isInt({ min: 3, max: 8 })
    .withMessage('Taille invalide (3-8 pieds)'),

  body('heightIn')
    .optional()
    .isInt({ min: 0, max: 11 })
    .withMessage('Pouces invalides (0-11)'),

  body('weightKg')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Poids invalide (30-300 kg)'),

  body('weightLbs')
    .optional()
    .isFloat({ min: 66, max: 660 })
    .withMessage('Poids invalide (66-660 lbs)'),

  body('fitnessLevel')
    .optional()
    .custom((value) => {
      if (value && !validateFitnessLevel(value)) {
        throw new Error('Niveau de fitness invalide');
      }
      return true;
    }),

  body('fitnessGoals')
    .optional()
    .isArray()
    .withMessage('Les objectifs doivent être un tableau')
    .custom((value) => {
      if (value && !validateFitnessGoals(value)) {
        throw new Error('Objectifs de fitness invalides');
      }
      return true;
    }),

  body('locationLat')
    .optional()
    .isFloat({ min: 12.0, max: 17.0 })
    .withMessage('Latitude invalide pour le Sénégal'),

  body('locationLng')
    .optional()
    .isFloat({ min: -18.0, max: -11.0 })
    .withMessage('Longitude invalide pour le Sénégal'),

  handleValidationErrors
];

/**
 * Forgot password validation middleware
 */
const validateForgotPassword = [
  body('email')
    .notEmpty()
    .withMessage('Email requis')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Reset password validation middleware
 */
const validateResetPassword = [
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .custom((value) => {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),

  body('accessToken')
    .notEmpty()
    .withMessage('Token de réinitialisation requis'),

  handleValidationErrors
];

/**
 * Payment validation middleware
 */
const validatePayment = [
  body('amount')
    .notEmpty()
    .withMessage('Montant requis')
    .isFloat({ min: 1000 })
    .withMessage('Montant minimum: 1000 XOF'),

  body('membershipPlanId')
    .notEmpty()
    .withMessage('Plan d\'abonnement requis')
    .custom((value) => {
      if (!validateUUID(value)) {
        throw new Error('ID de plan invalide');
      }
      return true;
    }),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Méthode de paiement requise')
    .isIn(['wave', 'orange_money'])
    .withMessage('Méthode de paiement invalide'),

  body('phoneNumber')
    .notEmpty()
    .withMessage('Numéro de téléphone requis')
    .custom((value) => {
      if (!validatePhoneNumber(value)) {
        throw new Error('Numéro de téléphone invalide');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Workout log validation middleware
 */
const validateWorkoutLog = [
  body('exerciseId')
    .notEmpty()
    .withMessage('ID d\'exercice requis')
    .custom((value) => {
      if (!validateUUID(value)) {
        throw new Error('ID d\'exercice invalide');
      }
      return true;
    }),

  body('sets')
    .notEmpty()
    .withMessage('Séries requises')
    .isArray({ min: 1 })
    .withMessage('Au moins une série requise'),

  body('sets.*.reps')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Répétitions invalides (1-1000)'),

  body('sets.*.weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Poids invalide'),

  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Durée invalide (minutes)'),

  body('caloriesBurned')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Calories brûlées invalides'),

  handleValidationErrors
];

/**
 * Nutrition log validation middleware
 */
const validateNutritionLog = [
  body('foodId')
    .notEmpty()
    .withMessage('ID d\'aliment requis')
    .custom((value) => {
      if (!validateUUID(value)) {
        throw new Error('ID d\'aliment invalide');
      }
      return true;
    }),

  body('quantity')
    .notEmpty()
    .withMessage('Quantité requise')
    .isFloat({ min: 0.1 })
    .withMessage('Quantité invalide'),

  body('unit')
    .notEmpty()
    .withMessage('Unité requise')
    .isIn(['g', 'kg', 'ml', 'l', 'cup', 'piece', 'serving'])
    .withMessage('Unité invalide'),

  body('mealType')
    .notEmpty()
    .withMessage('Type de repas requis')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('Type de repas invalide'),

  handleValidationErrors
];

/**
 * Query parameter validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)'),

  handleValidationErrors
];

/**
 * UUID parameter validation
 */
const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .notEmpty()
    .withMessage(`${paramName} requis`)
    .custom((value) => {
      if (!validateUUID(value)) {
        throw new Error(`Format ${paramName} invalide`);
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Date range validation
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Format de date de début invalide'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Format de date de fin invalide')
    .custom((value, { req }) => {
      if (value && req.query.startDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(value);
        if (end <= start) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Gym check-in validation
 */
const validateGymCheckIn = [
  body('gymId')
    .notEmpty()
    .withMessage('ID de salle requis')
    .custom((value) => {
      if (!validateUUID(value)) {
        throw new Error('ID de salle invalide');
      }
      return true;
    }),

  body('qrCode')
    .optional()
    .isString()
    .withMessage('QR code invalide'),

  handleValidationErrors
];

/**
 * File upload validation
 */
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Fichier requis'
      });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'Fichier trop volumineux (max 5MB)'
      });
    }

    next();
  };
};

/**
 * Custom validation middleware creator
 */
const createCustomValidation = (validationRules) => {
  return [
    ...validationRules,
    handleValidationErrors
  ];
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePhoneVerification,
  validateProfileUpdate,
  validateForgotPassword,
  validateResetPassword,
  validatePayment,
  validateWorkoutLog,
  validateNutritionLog,
  validatePagination,
  validateUUIDParam,
  validateDateRange,
  validateGymCheckIn,
  validateFileUpload,
  createCustomValidation,
  handleValidationErrors
};