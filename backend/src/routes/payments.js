const express = require('express');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const crypto = require('crypto');

const { logger } = require('../utils/logger');
const { asyncHandler, validationErrorHandler, APIError } = require('../middleware/errorHandler');
const { requireActiveMembership } = require('../middleware/authMiddleware');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// DEXCHANGE API configuration
const DEXCHANGE_CONFIG = {
  baseURL: process.env.DEXCHANGE_API_URL,
  apiKey: process.env.DEXCHANGE_API_KEY,
  secretKey: process.env.DEXCHANGE_SECRET_KEY,
  merchantId: process.env.DEXCHANGE_MERCHANT_ID
};

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate a payment transaction
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *               - membershipPlanId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in XOF
 *               paymentMethod:
 *                 type: string
 *                 enum: [wave, orange_money]
 *               membershipPlanId:
 *                 type: string
 *                 format: uuid
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number for mobile money payment
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 */
router.post('/initiate', [
  body('amount').isInt({ min: 100 }),
  body('paymentMethod').isIn(['wave', 'orange_money']),
  body('membershipPlanId').isUUID(),
  body('phoneNumber').optional().matches(/^\+221[0-9]{9}$/),
  validationErrorHandler(validationResult)
], asyncHandler(async (req, res) => {
  const { amount, paymentMethod, membershipPlanId, phoneNumber } = req.body;

  // Verify membership plan exists
  const { data: membershipPlan, error: planError } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', membershipPlanId)
    .single();

  if (planError || !membershipPlan) {
    throw new APIError('Invalid membership plan', 400, 'INVALID_PLAN');
  }

  // Verify amount matches plan price
  if (amount !== membershipPlan.price_xof) {
    throw new APIError('Amount does not match plan price', 400, 'AMOUNT_MISMATCH');
  }

  // Create payment transaction record
  const transactionData = {
    user_id: req.user.id,
    amount_xof: amount,
    currency: 'XOF',
    payment_method: paymentMethod,
    status: 'pending',
    gateway_response: {}
  };

  const { data: transaction, error: transactionError } = await supabase
    .from('payment_transactions')
    .insert([transactionData])
    .select()
    .single();

  if (transactionError) {
    throw new APIError('Error creating transaction', 500, 'TRANSACTION_ERROR');
  }

  try {
    // Initiate payment with DEXCHANGE API
    const paymentResponse = await initiateDexchangePayment({
      transactionId: transaction.id,
      amount,
      paymentMethod,
      phoneNumber: phoneNumber || req.user.phone_number,
      description: `Membership: ${membershipPlan.name}`,
      callbackUrl: `${process.env.API_BASE_URL}/api/payments/callback`
    });

    // Update transaction with gateway response
    await supabase
      .from('payment_transactions')
      .update({
        gateway_response: paymentResponse,
        transaction_id: paymentResponse.transactionId
      })
      .eq('id', transaction.id);

    logger.logPaymentTransaction(transaction);

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        transactionId: transaction.id,
        paymentUrl: paymentResponse.paymentUrl,
        qrCode: paymentResponse.qrCode,
        status: 'pending'
      }
    });
  } catch (error) {
    // Update transaction status to failed
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        gateway_response: { error: error.message }
      })
      .eq('id', transaction.id);

    throw new APIError('Payment initiation failed', 500, 'PAYMENT_INITIATION_ERROR');
  }
}));

/**
 * @swagger
 * /api/payments/status/{transactionId}:
 *   get:
 *     summary: Check payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/status/:transactionId', asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  // Get transaction details
  const { data: transaction, error: transactionError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', req.user.id)
    .single();

  if (transactionError || !transaction) {
    throw new APIError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
  }

  // Check status with DEXCHANGE API if still pending
  if (transaction.status === 'pending') {
    try {
      const statusResponse = await checkDexchangePaymentStatus(transaction.transaction_id);
      
      if (statusResponse.status !== 'pending') {
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({
            status: statusResponse.status,
            gateway_response: { ...transaction.gateway_response, statusCheck: statusResponse }
          })
          .eq('id', transaction.id);

        // If payment successful, create membership
        if (statusResponse.status === 'completed') {
          await createMembershipFromPayment(transaction);
        }

        transaction.status = statusResponse.status;
      }
    } catch (error) {
      logger.error('Payment status check error', { transactionId, error: error.message });
    }
  }

  res.json({
    success: true,
    data: {
      transactionId: transaction.id,
      amount: transaction.amount_xof,
      currency: transaction.currency,
      paymentMethod: transaction.payment_method,
      status: transaction.status,
      createdAt: transaction.created_at
    }
  });
}));

/**
 * @swagger
 * /api/payments/callback:
 *   post:
 *     summary: Payment callback from DEXCHANGE
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post('/callback', asyncHandler(async (req, res) => {
  const { transactionId, status, signature } = req.body;

  // Verify callback signature
  if (!verifyDexchangeSignature(req.body, signature)) {
    logger.warn('Invalid callback signature', { transactionId });
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  // Get transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .single();

  if (transactionError || !transaction) {
    logger.error('Transaction not found in callback', { transactionId });
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  // Update transaction status
  await supabase
    .from('payment_transactions')
    .update({
      status,
      gateway_response: { ...transaction.gateway_response, callback: req.body }
    })
    .eq('id', transaction.id);

  // If payment successful, create membership
  if (status === 'completed') {
    await createMembershipFromPayment(transaction);
  }

  logger.info('Payment callback processed', { transactionId, status });

  res.json({ success: true, message: 'Callback processed' });
}));

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get user payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Payment history retrieved
 */
router.get('/history', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get payment transactions
  const { data: transactions, error: transactionsError, count } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (transactionsError) {
    throw new APIError('Error fetching payment history', 500, 'FETCH_ERROR');
  }

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    }
  });
}));

/**
 * @swagger
 * /api/payments/membership-plans:
 *   get:
 *     summary: Get available membership plans
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Membership plans retrieved
 */
router.get('/membership-plans', asyncHandler(async (req, res) => {
  // Get active membership plans
  const { data: plans, error: plansError } = await supabase
    .from('membership_plans')
    .select(`
      *,
      gyms (
        id,
        name,
        address,
        city
      )
    `)
    .eq('is_active', true)
    .order('price_xof', { ascending: true });

  if (plansError) {
    throw new APIError('Error fetching membership plans', 500, 'FETCH_ERROR');
  }

  res.json({
    success: true,
    data: plans
  });
}));

/**
 * Helper function to initiate payment with DEXCHANGE API
 */
async function initiateDexchangePayment({
  transactionId,
  amount,
  paymentMethod,
  phoneNumber,
  description,
  callbackUrl
}) {
  const payload = {
    merchantId: DEXCHANGE_CONFIG.merchantId,
    transactionId,
    amount: amount.toString(),
    currency: 'XOF',
    paymentMethod: paymentMethod.toUpperCase(),
    phoneNumber,
    description,
    callbackUrl,
    timestamp: Date.now()
  };

  const signature = generateDexchangeSignature(payload);

  try {
    const response = await axios.post(
      `${DEXCHANGE_CONFIG.baseURL}/payments/initiate`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${DEXCHANGE_CONFIG.apiKey}`,
          'X-Signature': signature,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data;
  } catch (error) {
    logger.error('DEXCHANGE API error', {
      error: error.response?.data || error.message,
      payload
    });
    throw new APIError('Payment gateway error', 500, 'GATEWAY_ERROR');
  }
}

/**
 * Helper function to check payment status with DEXCHANGE API
 */
async function checkDexchangePaymentStatus(transactionId) {
  const payload = {
    merchantId: DEXCHANGE_CONFIG.merchantId,
    transactionId,
    timestamp: Date.now()
  };

  const signature = generateDexchangeSignature(payload);

  try {
    const response = await axios.get(
      `${DEXCHANGE_CONFIG.baseURL}/payments/status/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${DEXCHANGE_CONFIG.apiKey}`,
          'X-Signature': signature
        },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error) {
    logger.error('DEXCHANGE status check error', {
      transactionId,
      error: error.response?.data || error.message
    });
    throw new APIError('Status check failed', 500, 'STATUS_CHECK_ERROR');
  }
}

/**
 * Helper function to generate DEXCHANGE API signature
 */
function generateDexchangeSignature(payload) {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${payload[key]}`)
    .join('&');

  return crypto
    .createHmac('sha256', DEXCHANGE_CONFIG.secretKey)
    .update(queryString)
    .digest('hex');
}

/**
 * Helper function to verify DEXCHANGE callback signature
 */
function verifyDexchangeSignature(payload, signature) {
  const expectedSignature = generateDexchangeSignature(payload);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Helper function to create membership from successful payment
 */
async function createMembershipFromPayment(transaction) {
  try {
    // Get the membership plan from the transaction context
    // This would need to be stored in the transaction or retrieved from context
    const { data: membershipPlan } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('price_xof', transaction.amount_xof)
      .eq('is_active', true)
      .single();

    if (!membershipPlan) {
      throw new Error('Membership plan not found');
    }

    // Calculate membership dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membershipPlan.duration_days);

    // Create membership
    const { error: membershipError } = await supabase
      .from('user_memberships')
      .insert([{
        user_id: transaction.user_id,
        plan_id: membershipPlan.id,
        gym_id: membershipPlan.gym_id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active'
      }]);

    if (membershipError) {
      logger.error('Error creating membership', { error: membershipError.message });
      throw new Error('Membership creation failed');
    }

    logger.info('Membership created from payment', {
      transactionId: transaction.id,
      userId: transaction.user_id,
      planId: membershipPlan.id
    });
  } catch (error) {
    logger.error('Error creating membership from payment', {
      transactionId: transaction.id,
      error: error.message
    });
    throw error;
  }
}

module.exports = router;