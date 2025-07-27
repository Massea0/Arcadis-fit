const express = require('express');
const gymController = require('../controllers/gymController');
const {
  authenticateToken,
  requirePhoneVerification,
  requireActiveMembership,
  requireAdmin
} = require('../middleware/auth');
const {
  validatePagination,
  validateUUIDParam,
  validateGymReview,
  validateCheckIn,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

// Routes publiques
router.get('/', gymController.getAllGyms);
router.get('/nearby', gymController.getGymsNearby);
router.get('/:gymId', validateUUIDParam('gymId'), gymController.getGymById);

// Routes protégées - Check-in/Check-out
router.post('/checkin',
  authenticateToken,
  requirePhoneVerification,
  requireActiveMembership,
  validateCheckIn,
  gymController.checkIn
);

router.post('/checkout/:checkInId',
  authenticateToken,
  requirePhoneVerification,
  validateUUIDParam('checkInId'),
  gymController.checkOut
);

router.get('/checkins/history',
  authenticateToken,
  requirePhoneVerification,
  validatePagination,
  gymController.getCheckInHistory
);

// Routes protégées - Avis
router.post('/:gymId/reviews',
  authenticateToken,
  requirePhoneVerification,
  validateUUIDParam('gymId'),
  validateGymReview,
  gymController.createReview
);

// Routes admin - Statistiques
router.get('/:gymId/stats',
  authenticateToken,
  requireAdmin,
  validateUUIDParam('gymId'),
  validateDateRange,
  gymController.getGymStats
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gym service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;