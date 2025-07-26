const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Validation pour l'inscription
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone')
    .optional()
    .isMobilePhone('fr-FR')
    .withMessage('Numéro de téléphone invalide'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide (format YYYY-MM-DD)'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Genre invalide (male, female, other)')
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// Validation pour le mot de passe oublié
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis')
];

// Validation pour la réinitialisation du mot de passe
const resetPasswordValidation = [
  body('access_token')
    .notEmpty()
    .withMessage('Token d\'accès requis'),
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token requis'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Validation pour le changement de mot de passe
const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('Mot de passe actuel requis'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Routes publiques
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Routes protégées (nécessitent une authentification)
router.use(authenticateUser);

router.get('/profile', authController.getProfile);
router.post('/logout', authController.logout);
router.post('/change-password', changePasswordValidation, authController.changePassword);

module.exports = router;