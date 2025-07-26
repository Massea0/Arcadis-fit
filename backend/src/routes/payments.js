const express = require('express');
const paymentController = require('../controllers/paymentController');
const { 
  authenticateToken, 
  requirePhoneVerification,
  requireAdmin
} = require('../middleware/auth');
const { 
  validatePayment, 
  validatePagination,
  validateUUIDParam,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/payments/plans
 * @desc    Get available membership plans
 * @access  Public
 */
router.get('/plans', paymentController.getMembershipPlans);

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate payment for membership
 * @access  Private
 */
router.post('/initiate', 
  authenticateToken, 
  requirePhoneVerification, 
  validatePayment, 
  paymentController.initiatePayment
);

/**
 * @route   GET /api/payments/:paymentId/status
 * @desc    Check payment status
 * @access  Private
 */
router.get('/:paymentId/status', 
  authenticateToken, 
  validateUUIDParam('paymentId'),
  paymentController.checkPaymentStatus
);

/**
 * @route   GET /api/payments/history
 * @desc    Get user payment history
 * @access  Private
 */
router.get('/history', 
  authenticateToken, 
  requirePhoneVerification,
  validatePagination,
  paymentController.getPaymentHistory
);

/**
 * @route   POST /api/payments/webhook
 * @desc    Webhook handler for DEXCHANGE payment notifications
 * @access  Public (webhook)
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * @route   POST /api/payments/:paymentId/refund
 * @desc    Refund a payment (admin only)
 * @access  Private (Admin)
 */
router.post('/:paymentId/refund', 
  authenticateToken, 
  requireAdmin,
  validateUUIDParam('paymentId'),
  paymentController.refundPayment
);

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', 
  authenticateToken, 
  requireAdmin,
  validateDateRange,
  paymentController.getPaymentStats
);

/**
 * @route   GET /api/payments/health
 * @desc    Health check for payment service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payment service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;