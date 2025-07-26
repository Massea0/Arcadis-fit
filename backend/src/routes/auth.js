const express = require('express');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const twilio = require('twilio');

const { logger } = require('../utils/logger');
const { asyncHandler, validationErrorHandler, APIError } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - phoneNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               fitnessLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               fitnessGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('phoneNumber').matches(/^\+221[0-9]{9}$/),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  body('fitnessLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('fitnessGoals').optional().isArray(),
  validationErrorHandler(validationResult)
], asyncHandler(async (req, res) => {
  const {
    email,
    password,
    fullName,
    phoneNumber,
    dateOfBirth,
    gender,
    fitnessLevel,
    fitnessGoals
  } = req.body;

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${email},phone_number.eq.${phoneNumber}`)
    .single();

  if (existingUser) {
    throw new APIError('User with this email or phone number already exists', 400, 'USER_EXISTS');
  }

  // Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email,
    password,
    phone: phoneNumber
  });

  if (authError) {
    logger.error('Supabase auth error', { error: authError.message });
    throw new APIError('Registration failed', 500, 'AUTH_ERROR');
  }

  // Create user profile in our database
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .insert([{
      id: authUser.user.id,
      email,
      phone_number: phoneNumber,
      full_name: fullName,
      date_of_birth: dateOfBirth,
      gender,
      fitness_level: fitnessLevel || 'beginner',
      fitness_goals: fitnessGoals || [],
      language_preference: 'fr', // Default to French for Senegal
      units_preference: 'metric' // Default to metric
    }])
    .select()
    .single();

  if (profileError) {
    logger.error('Profile creation error', { error: profileError.message });
    throw new APIError('Profile creation failed', 500, 'PROFILE_ERROR');
  }

  // Send phone verification code
  await sendPhoneVerificationCode(userProfile.id, phoneNumber);

  logger.logUserAction('user_registered', userProfile.id, {
    email,
    phoneNumber,
    fitnessLevel
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your phone number.',
    data: {
      userId: userProfile.id,
      email: userProfile.email,
      phoneVerified: userProfile.phone_verified
    }
  });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validationErrorHandler(validationResult)
], asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    logger.warn('Login failed', { email, error: authError.message });
    throw new APIError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    throw new APIError('Error fetching user profile', 500, 'PROFILE_ERROR');
  }

  // Generate JWT token with appropriate expiry
  const tokenExpiry = rememberMe ? '30d' : '7d';
  const token = jwt.sign(
    { userId: userProfile.id, email: userProfile.email },
    process.env.JWT_SECRET,
    { expiresIn: tokenExpiry }
  );

  logger.logUserAction('user_login', userProfile.id, {
    email,
    rememberMe
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name,
        phoneVerified: userProfile.phone_verified,
        onboardingCompleted: userProfile.onboarding_completed,
        profilePicture: userProfile.profile_picture_url
      }
    }
  });
}));

/**
 * @swagger
 * /api/auth/send-verification-code:
 *   post:
 *     summary: Send phone verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent
 */
router.post('/send-verification-code', [
  body('phoneNumber').matches(/^\+221[0-9]{9}$/),
  validationErrorHandler(validationResult)
], asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  // Check if phone number exists
  const { data: user } = await supabase
    .from('users')
    .select('id, phone_verified')
    .eq('phone_number', phoneNumber)
    .single();

  if (!user) {
    throw new APIError('Phone number not found', 404, 'PHONE_NOT_FOUND');
  }

  if (user.phone_verified) {
    throw new APIError('Phone number already verified', 400, 'ALREADY_VERIFIED');
  }

  await sendPhoneVerificationCode(user.id, phoneNumber);

  res.json({
    success: true,
    message: 'Verification code sent successfully'
  });
}));

/**
 * @swagger
 * /api/auth/verify-phone:
 *   post:
 *     summary: Verify phone number with code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Phone verified successfully
 */
router.post('/verify-phone', [
  body('phoneNumber').matches(/^\+221[0-9]{9}$/),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  validationErrorHandler(validationResult)
], asyncHandler(async (req, res) => {
  const { phoneNumber, code } = req.body;

  // Verify the code
  const { data: verificationCode, error: codeError } = await supabase
    .from('user_verification_codes')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (codeError || !verificationCode) {
    throw new APIError('Invalid or expired verification code', 400, 'INVALID_CODE');
  }

  // Mark code as used
  await supabase
    .from('user_verification_codes')
    .update({ used: true })
    .eq('id', verificationCode.id);

  // Update user phone verification status
  const { error: updateError } = await supabase
    .from('users')
    .update({ phone_verified: true })
    .eq('phone_number', phoneNumber);

  if (updateError) {
    throw new APIError('Error updating phone verification status', 500, 'UPDATE_ERROR');
  }

  logger.logUserAction('phone_verified', verificationCode.user_id, {
    phoneNumber
  });

  res.json({
    success: true,
    message: 'Phone number verified successfully'
  });
}));

/**
 * @swagger
 * /api/auth/complete-onboarding:
 *   post:
 *     summary: Complete user onboarding
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - height
 *               - weight
 *               - fitnessGoals
 *             properties:
 *               height:
 *                 type: object
 *                 properties:
 *                   cm:
 *                     type: number
 *                   ft:
 *                     type: number
 *                   in:
 *                     type: number
 *               weight:
 *                 type: object
 *                 properties:
 *                   kg:
 *                     type: number
 *                   lbs:
 *                     type: number
 *               fitnessGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *     responses:
 *       200:
 *         description: Onboarding completed
 */
router.post('/complete-onboarding', authMiddleware, [
  body('height').isObject(),
  body('weight').isObject(),
  body('fitnessGoals').isArray(),
  body('location').optional().isObject(),
  validationErrorHandler(validationResult)
], asyncHandler(async (req, res) => {
  const { height, weight, fitnessGoals, location } = req.body;

  // Update user profile with onboarding data
  const updateData = {
    height_cm: height.cm,
    height_ft: height.ft,
    height_in: height.in,
    weight_kg: weight.kg,
    weight_lbs: weight.lbs,
    fitness_goals: fitnessGoals,
    onboarding_completed: true
  };

  if (location) {
    updateData.location_lat = location.lat;
    updateData.location_lng = location.lng;
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', req.user.id)
    .select()
    .single();

  if (updateError) {
    throw new APIError('Error updating onboarding data', 500, 'UPDATE_ERROR');
  }

  logger.logUserAction('onboarding_completed', req.user.id, {
    fitnessGoals,
    hasLocation: !!location
  });

  res.json({
    success: true,
    message: 'Onboarding completed successfully',
    data: {
      user: updatedUser
    }
  });
}));

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh-token', authMiddleware, asyncHandler(async (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id, email: req.user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: { token }
  });
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  // In a more complex setup, you might want to blacklist the token
  logger.logUserAction('user_logout', req.user.id);

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
  validationErrorHandler(validationResult)
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`
  });

  if (error) {
    logger.error('Password reset error', { email, error: error.message });
    throw new APIError('Error sending password reset email', 500, 'RESET_ERROR');
  }

  res.json({
    success: true,
    message: 'Password reset email sent successfully'
  });
}));

/**
 * Helper function to send phone verification code
 */
async function sendPhoneVerificationCode(userId, phoneNumber) {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save verification code to database
  const { error: dbError } = await supabase
    .from('user_verification_codes')
    .insert([{
      user_id: userId,
      phone_number: phoneNumber,
      code,
      expires_at: expiresAt
    }]);

  if (dbError) {
    logger.error('Error saving verification code', { error: dbError.message });
    throw new APIError('Error generating verification code', 500, 'CODE_GENERATION_ERROR');
  }

  // Send SMS via Twilio
  try {
    await twilioClient.messages.create({
      body: `Votre code de vérification Arcadis Fit est: ${code}. Valide pendant 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    logger.info('Verification code sent', { userId, phoneNumber });
  } catch (smsError) {
    logger.error('SMS sending error', { error: smsError.message, phoneNumber });
    throw new APIError('Error sending verification code', 500, 'SMS_ERROR');
  }
}

module.exports = router;