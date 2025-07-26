const express = require('express');
const multer = require('multer');
const userController = require('../controllers/userController');
const { authenticateToken, requirePhoneVerification } = require('../middleware/auth');
const { 
  validateProfileUpdate, 
  validatePagination,
  validateUUIDParam,
  validateFileUpload 
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, requirePhoneVerification, validateProfileUpdate, userController.updateProfile);

/**
 * @route   POST /api/users/profile/picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/profile/picture', 
  authenticateToken, 
  requirePhoneVerification,
  upload.single('profilePicture'),
  validateFileUpload(['image/jpeg', 'image/png', 'image/webp']),
  userController.uploadProfilePicture
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, requirePhoneVerification, userController.getUserStats);

/**
 * @route   PUT /api/users/privacy
 * @desc    Update privacy settings
 * @access  Private
 */
router.put('/privacy', authenticateToken, requirePhoneVerification, userController.updatePrivacySettings);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticateToken, userController.deleteAccount);

/**
 * @route   GET /api/users/preferences
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/preferences', authenticateToken, requirePhoneVerification, userController.getPreferences);

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', authenticateToken, requirePhoneVerification, userController.updatePreferences);

/**
 * @route   GET /api/users/activity-feed
 * @desc    Get user activity feed
 * @access  Private
 */
router.get('/activity-feed', 
  authenticateToken, 
  requirePhoneVerification, 
  validatePagination, 
  userController.getActivityFeed
);

/**
 * @route   GET /api/users/export-data
 * @desc    Export user data (GDPR compliance)
 * @access  Private
 */
router.get('/export-data', authenticateToken, userController.exportUserData);

/**
 * @route   POST /api/users/complete-onboarding
 * @desc    Complete onboarding process
 * @access  Private
 */
router.post('/complete-onboarding', authenticateToken, userController.completeOnboarding);

/**
 * @route   GET /api/users/health
 * @desc    Health check for user service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;