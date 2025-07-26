const express = require('express');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

const { logger } = require('../utils/logger');
const { asyncHandler, validationErrorHandler, APIError } = require('../middleware/errorHandler');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation schemas
const updateProfileValidation = [
  body('full_name').optional().isString().isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('date_of_birth').optional().isISO8601().withMessage('Date of birth must be a valid date'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
  body('height_cm').optional().isInt({ min: 100, max: 250 }).withMessage('Height must be between 100 and 250 cm'),
  body('weight_kg').optional().isFloat({ min: 30, max: 300 }).withMessage('Weight must be between 30 and 300 kg'),
  body('fitness_level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid fitness level'),
  body('fitness_goals').optional().isArray().withMessage('Fitness goals must be an array'),
  body('units_preference').optional().isIn(['metric', 'imperial']).withMessage('Invalid units preference'),
  body('language_preference').optional().isIn(['fr', 'en', 'wo']).withMessage('Invalid language preference'),
  body('privacy_settings').optional().isObject().withMessage('Privacy settings must be an object')
];

/**
 * @route GET /api/users/profile
 * @desc Get current user's profile
 * @access Private
 */
router.get('/profile',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone_number,
          phone_verified,
          date_of_birth,
          gender,
          height_cm,
          weight_kg,
          fitness_level,
          fitness_goals,
          profile_picture_url,
          units_preference,
          language_preference,
          location_lat,
          location_lng,
          privacy_settings,
          onboarding_completed,
          created_at,
          updated_at,
          total_workouts,
          total_workout_minutes,
          total_calories_burned,
          total_meals,
          total_calories_consumed,
          last_workout_date,
          last_meal_date
        `)
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new APIError('User not found', 404);
      }

      res.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: user
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/users/profile
 * @desc Update current user's profile
 * @access Private
 */
router.put('/profile',
  updateProfileValidation,
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;

    try {
      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.email;
      delete updateData.phone_number;
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error || !updatedUser) {
        throw new APIError('Failed to update user profile', 500);
      }

      res.json({
        success: true,
        message: 'User profile updated successfully',
        data: updatedUser
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/users/phone
 * @desc Update user's phone number
 * @access Private
 */
router.put('/phone',
  [
    body('phone_number').matches(/^\+221[0-9]{9}$/).withMessage('Phone number must be a valid Senegalese number (+221XXXXXXXXX)')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { phone_number } = req.body;

    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          phone_number,
          phone_verified: false, // Reset verification when phone number changes
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error || !updatedUser) {
        throw new APIError('Failed to update phone number', 500);
      }

      res.json({
        success: true,
        message: 'Phone number updated successfully. Please verify your new number.',
        data: updatedUser
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/users/password
 * @desc Update user's password
 * @access Private
 */
router.put('/password',
  [
    body('current_password').isString().isLength({ min: 8 }).withMessage('Current password is required'),
    body('new_password').isString().isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    try {
      // Verify current password
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new APIError('User not found', 404);
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: new_password
      });

      if (updateError) {
        logger.error('Error updating password:', updateError);
        throw new APIError('Failed to update password', 500);
      }

      res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/users/stats
 * @desc Get user's fitness statistics
 * @access Private
 */
router.get('/stats',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get user's basic stats
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          total_workouts,
          total_workout_minutes,
          total_calories_burned,
          total_meals,
          total_calories_consumed,
          last_workout_date,
          last_meal_date
        `)
        .eq('id', userId)
        .single();

      if (userError) {
        throw new APIError('User not found', 404);
      }

      // Get recent workout logs
      const { data: workouts, error: workoutError } = await supabase
        .from('workout_logs')
        .select('duration_minutes, calories_burned, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      if (workoutError) {
        logger.error('Error fetching workout logs:', workoutError);
      }

      // Get recent nutrition logs
      const { data: meals, error: mealError } = await supabase
        .from('nutrition_logs')
        .select('total_calories, consumed_at')
        .eq('user_id', userId)
        .gte('consumed_at', startDate.toISOString())
        .lte('consumed_at', endDate.toISOString());

      if (mealError) {
        logger.error('Error fetching nutrition logs:', mealError);
      }

      // Calculate period-specific stats
      const periodStats = {
        workouts_count: workouts?.length || 0,
        total_workout_minutes: workouts?.reduce((sum, w) => sum + w.duration_minutes, 0) || 0,
        total_calories_burned: workouts?.reduce((sum, w) => sum + w.calories_burned, 0) || 0,
        meals_count: meals?.length || 0,
        total_calories_consumed: meals?.reduce((sum, m) => sum + m.total_calories, 0) || 0,
        average_workout_duration: workouts?.length > 0 ? 
          Math.round(workouts.reduce((sum, w) => sum + w.duration_minutes, 0) / workouts.length) : 0,
        average_calories_per_workout: workouts?.length > 0 ?
          Math.round(workouts.reduce((sum, w) => sum + w.calories_burned, 0) / workouts.length) : 0,
        average_calories_per_meal: meals?.length > 0 ?
          Math.round(meals.reduce((sum, m) => sum + m.total_calories, 0) / meals.length) : 0
      };

      // Calculate streak information
      const streakInfo = await calculateStreaks(userId, startDate, endDate);

      res.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
          overall: user,
          period: periodStats,
          streaks: streakInfo,
          period_days: period
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route DELETE /api/users/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account',
  [
    body('password').isString().withMessage('Password is required for account deletion')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    try {
      // Verify password before deletion
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new APIError('User not found', 404);
      }

      // Delete user from Supabase Auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) {
        logger.error('Error deleting user from auth:', deleteError);
        throw new APIError('Failed to delete account', 500);
      }

      // Soft delete user data from database
      const { error: softDeleteError } = await supabase
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
          status: 'deleted'
        })
        .eq('id', userId);

      if (softDeleteError) {
        logger.error('Error soft deleting user data:', softDeleteError);
      }

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/users/preferences
 * @desc Get user preferences
 * @access Private
 */
router.get('/preferences',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          units_preference,
          language_preference,
          privacy_settings,
          workout_preferences,
          nutrition_preferences,
          notification_preferences
        `)
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new APIError('User not found', 404);
      }

      res.json({
        success: true,
        message: 'User preferences retrieved successfully',
        data: user
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/users/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put('/preferences',
  [
    body('units_preference').optional().isIn(['metric', 'imperial']).withMessage('Invalid units preference'),
    body('language_preference').optional().isIn(['fr', 'en', 'wo']).withMessage('Invalid language preference'),
    body('privacy_settings').optional().isObject().withMessage('Privacy settings must be an object'),
    body('workout_preferences').optional().isObject().withMessage('Workout preferences must be an object'),
    body('nutrition_preferences').optional().isObject().withMessage('Nutrition preferences must be an object'),
    body('notification_preferences').optional().isObject().withMessage('Notification preferences must be an object')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const preferences = req.body;

    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error || !updatedUser) {
        throw new APIError('Failed to update preferences', 500);
      }

      res.json({
        success: true,
        message: 'User preferences updated successfully',
        data: updatedUser
      });

    } catch (error) {
      throw error;
    }
  })
);

// Helper function to calculate streaks
async function calculateStreaks(userId, startDate, endDate) {
  try {
    // Get workout logs for the period
    const { data: workouts } = await supabase
      .from('workout_logs')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())
      .order('completed_at', { ascending: true });

    // Get nutrition logs for the period
    const { data: meals } = await supabase
      .from('nutrition_logs')
      .select('consumed_at')
      .eq('user_id', userId)
      .gte('consumed_at', startDate.toISOString())
      .lte('consumed_at', endDate.toISOString())
      .order('consumed_at', { ascending: true });

    // Calculate workout streak
    const workoutStreak = calculateConsecutiveDays(workouts?.map(w => w.completed_at) || []);
    
    // Calculate nutrition streak
    const nutritionStreak = calculateConsecutiveDays(meals?.map(m => m.consumed_at) || []);

    return {
      workout_streak: workoutStreak,
      nutrition_streak: nutritionStreak,
      current_workout_streak: workoutStreak.current,
      current_nutrition_streak: nutritionStreak.current,
      longest_workout_streak: workoutStreak.longest,
      longest_nutrition_streak: nutritionStreak.longest
    };

  } catch (error) {
    logger.error('Error calculating streaks:', error);
    return {
      workout_streak: { current: 0, longest: 0 },
      nutrition_streak: { current: 0, longest: 0 },
      current_workout_streak: 0,
      current_nutrition_streak: 0,
      longest_workout_streak: 0,
      longest_nutrition_streak: 0
    };
  }
}

// Helper function to calculate consecutive days
function calculateConsecutiveDays(dates) {
  if (!dates || dates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sortedDates = dates
    .map(date => new Date(date).toDateString())
    .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
    .sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const previousDate = i > 0 ? new Date(sortedDates[i - 1]) : null;

    if (!previousDate || (currentDate - previousDate) / (1000 * 60 * 60 * 24) === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }

    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Calculate current streak (from today backwards)
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  if (sortedDates.includes(today)) {
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedDates[i]);
      const nextDate = new Date(sortedDates[i + 1]);
      
      if ((nextDate - currentDate) / (1000 * 60 * 60 * 24) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (sortedDates.includes(yesterday)) {
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedDates[i]);
      const nextDate = new Date(sortedDates[i + 1]);
      
      if ((nextDate - currentDate) / (1000 * 60 * 60 * 24) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak
  };
}

module.exports = router;