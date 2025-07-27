// Routes pour la gestion des notifications
const express = require('express');
const notificationController = require('../controllers/notificationController');
const {
  authenticateToken,
  requirePhoneVerification,
  requireAdmin
} = require('../middleware/auth');
const {
  validatePagination,
  validateUUIDParam
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Validation pour la création de notification
const validateNotification = [
  body('user_id')
    .isUUID()
    .withMessage('ID utilisateur invalide'),
  body('title')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Le titre est requis (max 255 caractères)'),
  body('message')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Le message est requis (max 1000 caractères)'),
  body('type')
    .isIn(['workout_reminder', 'payment_confirmation', 'membership_expiry', 'promotional', 'system', 'achievement'])
    .withMessage('Type de notification invalide'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Date d\'expiration invalide')
];

// Validation pour les préférences de notification
const validateNotificationPreferences = [
  body('notifications')
    .isObject()
    .withMessage('Les préférences doivent être un objet'),
  body('notifications.email')
    .optional()
    .isObject()
    .withMessage('Les préférences email doivent être un objet'),
  body('notifications.push')
    .optional()
    .isObject()
    .withMessage('Les préférences push doivent être un objet'),
  body('notifications.sms')
    .optional()
    .isObject()
    .withMessage('Les préférences SMS doivent être un objet')
];

/**
 * @route GET /api/notifications
 * @desc Obtenir les notifications d'un utilisateur
 * @access Private
 */
router.get('/',
  authenticateToken,
  requirePhoneVerification,
  validatePagination,
  notificationController.getNotifications
);

/**
 * @route PUT /api/notifications/:notificationId/read
 * @desc Marquer une notification comme lue
 * @access Private
 */
router.put('/:notificationId/read',
  authenticateToken,
  requirePhoneVerification,
  validateUUIDParam('notificationId'),
  notificationController.markNotificationAsRead
);

/**
 * @route PUT /api/notifications/read-all
 * @desc Marquer toutes les notifications comme lues
 * @access Private
 */
router.put('/read-all',
  authenticateToken,
  requirePhoneVerification,
  notificationController.markAllNotificationsAsRead
);

/**
 * @route DELETE /api/notifications/:notificationId
 * @desc Supprimer une notification
 * @access Private
 */
router.delete('/:notificationId',
  authenticateToken,
  requirePhoneVerification,
  validateUUIDParam('notificationId'),
  notificationController.deleteNotification
);

/**
 * @route GET /api/notifications/preferences
 * @desc Obtenir les préférences de notification
 * @access Private
 */
router.get('/preferences',
  authenticateToken,
  requirePhoneVerification,
  notificationController.getNotificationPreferences
);

/**
 * @route PUT /api/notifications/preferences
 * @desc Mettre à jour les préférences de notification
 * @access Private
 */
router.put('/preferences',
  authenticateToken,
  requirePhoneVerification,
  validateNotificationPreferences,
  notificationController.updateNotificationPreferences
);

/**
 * @route GET /api/notifications/stats
 * @desc Obtenir les statistiques des notifications
 * @access Private
 */
router.get('/stats',
  authenticateToken,
  requirePhoneVerification,
  notificationController.getNotificationStats
);

/**
 * @route POST /api/notifications
 * @desc Créer une nouvelle notification (admin seulement)
 * @access Private (Admin)
 */
router.post('/',
  authenticateToken,
  requireAdmin,
  validateNotification,
  notificationController.createNotification
);

/**
 * @route GET /api/notifications/health
 * @desc Health check pour le service notifications
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service notifications opérationnel',
    timestamp: new Date().toISOString(),
    features: [
      'Notifications push',
      'Notifications email',
      'Notifications SMS',
      'Préférences personnalisées',
      'Rappels automatiques',
      'Statistiques de lecture'
    ]
  });
});

module.exports = router;