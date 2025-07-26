const express = require('express');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const { logger } = require('../utils/logger');
const { asyncHandler, validationErrorHandler, APIError } = require('../middleware/errorHandler');
const { requireActiveMembership } = require('../middleware/authMiddleware');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const WORKOUT_AI_URL = process.env.WORKOUT_AI_URL || 'http://localhost:8002';

// Validation schemas
const generateWorkoutPlanValidation = [
  body('duration_weeks').isInt({ min: 1, max: 12 }).withMessage('Duration must be between 1 and 12 weeks'),
  body('workouts_per_week').isInt({ min: 1, max: 7 }).withMessage('Workouts per week must be between 1 and 7'),
  body('focus_areas').isArray().withMessage('Focus areas must be an array'),
  body('include_cardio').isBoolean().withMessage('Include cardio must be a boolean'),
  body('include_strength').isBoolean().withMessage('Include strength must be a boolean'),
  body('include_flexibility').isBoolean().withMessage('Include flexibility must be a boolean')
];

const logWorkoutValidation = [
  body('session_id').isString().notEmpty().withMessage('Session ID is required'),
  body('duration_minutes').isInt({ min: 1 }).withMessage('Duration must be positive'),
  body('calories_burned').isFloat({ min: 0 }).withMessage('Calories burned must be positive'),
  body('exercises').isArray().withMessage('Exercises must be an array'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

/**
 * @route POST /api/workouts/generate-plan
 * @desc Generate personalized workout plan using AI
 * @access Private
 */
router.post('/generate-plan', 
  requireActiveMembership,
  generateWorkoutPlanValidation,
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { duration_weeks, workouts_per_week, focus_areas, include_cardio, include_strength, include_flexibility } = req.body;
    const userId = req.user.id;

    try {
      // Get user profile from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new APIError('User not found', 404);
      }

      // Prepare user profile for AI service
      const userProfile = {
        user_id: userId,
        age: user.age || 25,
        gender: user.gender || 'male',
        height_cm: user.height_cm || 170,
        weight_kg: user.weight_kg || 70,
        fitness_level: user.fitness_level || 'beginner',
        fitness_goals: user.fitness_goals || ['general_fitness'],
        experience_years: user.experience_years || 0,
        available_equipment: user.available_equipment || ['none'],
        time_availability: user.time_availability || 60,
        injuries: user.injuries || [],
        preferences: user.workout_preferences || {},
        language: user.language_preference || 'fr'
      };

      // Call AI service
      const aiResponse = await axios.post(`${WORKOUT_AI_URL}/generate-workout-plan`, {
        user_profile: userProfile,
        duration_weeks,
        workouts_per_week,
        focus_areas,
        include_cardio,
        include_strength,
        include_flexibility
      });

      const workoutPlan = aiResponse.data;

      // Save workout plan to database
      const { data: savedPlan, error: saveError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: userId,
          name: `Plan d'entraînement ${duration_weeks} semaines`,
          start_date: workoutPlan.start_date,
          end_date: workoutPlan.end_date,
          total_weeks: workoutPlan.total_weeks,
          workouts_per_week: workoutPlan.workouts_per_week,
          total_workouts: workoutPlan.total_workouts,
          progression_plan: workoutPlan.progression_plan,
          equipment_requirements: workoutPlan.equipment_requirements,
          nutrition_recommendations: workoutPlan.nutrition_recommendations,
          status: 'active'
        })
        .select()
        .single();

      if (saveError) {
        logger.error('Error saving workout plan:', saveError);
        throw new APIError('Failed to save workout plan', 500);
      }

      // Save individual sessions
      const sessionsToInsert = workoutPlan.sessions.map(session => ({
        workout_plan_id: savedPlan.id,
        user_id: userId,
        name: session.name,
        name_fr: session.name_fr,
        category: session.category,
        duration_minutes: session.duration_minutes,
        difficulty_level: session.difficulty_level,
        exercises: session.exercises,
        warm_up: session.warm_up,
        cool_down: session.cool_down,
        total_calories: session.total_calories,
        target_muscle_groups: session.target_muscle_groups,
        equipment_needed: session.equipment_needed,
        notes: session.notes,
        scheduled_date: null, // Will be set when user schedules
        status: 'pending'
      }));

      const { error: sessionsError } = await supabase
        .from('workout_sessions')
        .insert(sessionsToInsert);

      if (sessionsError) {
        logger.error('Error saving workout sessions:', sessionsError);
        throw new APIError('Failed to save workout sessions', 500);
      }

      res.json({
        success: true,
        message: 'Workout plan generated successfully',
        data: {
          plan: savedPlan,
          sessions: workoutPlan.sessions
        }
      });

    } catch (error) {
      if (error.response) {
        // AI service error
        logger.error('AI service error:', error.response.data);
        throw new APIError('Failed to generate workout plan', 500);
      }
      throw error;
    }
  })
);

/**
 * @route POST /api/workouts/recommendations
 * @desc Get personalized workout recommendations
 * @access Private
 */
router.post('/recommendations',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new APIError('User not found', 404);
      }

      // Prepare user profile
      const userProfile = {
        user_id: userId,
        age: user.age || 25,
        gender: user.gender || 'male',
        height_cm: user.height_cm || 170,
        weight_kg: user.weight_kg || 70,
        fitness_level: user.fitness_level || 'beginner',
        fitness_goals: user.fitness_goals || ['general_fitness'],
        experience_years: user.experience_years || 0,
        available_equipment: user.available_equipment || ['none'],
        time_availability: user.time_availability || 60,
        injuries: user.injuries || [],
        preferences: user.workout_preferences || {},
        language: user.language_preference || 'fr'
      };

      // Call AI service
      const aiResponse = await axios.post(`${WORKOUT_AI_URL}/workout-recommendations`, userProfile);

      res.json({
        success: true,
        message: 'Workout recommendations retrieved successfully',
        data: aiResponse.data
      });

    } catch (error) {
      if (error.response) {
        logger.error('AI service error:', error.response.data);
        throw new APIError('Failed to get recommendations', 500);
      }
      throw error;
    }
  })
);

/**
 * @route GET /api/workouts/exercises
 * @desc Get exercise database with optional filtering
 * @access Private
 */
router.get('/exercises',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const { category, difficulty, muscle_group } = req.query;

    try {
      // Call AI service
      const aiResponse = await axios.get(`${WORKOUT_AI_URL}/exercises`, {
        params: { category, difficulty, muscle_group }
      });

      res.json({
        success: true,
        message: 'Exercises retrieved successfully',
        data: aiResponse.data
      });

    } catch (error) {
      if (error.response) {
        logger.error('AI service error:', error.response.data);
        throw new APIError('Failed to get exercises', 500);
      }
      throw error;
    }
  })
);

/**
 * @route POST /api/workouts/search-exercises
 * @desc Search for exercises
 * @access Private
 */
router.post('/search-exercises',
  requireActiveMembership,
  [
    body('query').isString().notEmpty().withMessage('Search query is required'),
    body('language').optional().isString().withMessage('Language must be a string')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { query, language = 'fr' } = req.body;

    try {
      // Call AI service
      const aiResponse = await axios.post(`${WORKOUT_AI_URL}/exercise-search`, {
        query,
        language
      });

      res.json({
        success: true,
        message: 'Exercise search completed successfully',
        data: aiResponse.data
      });

    } catch (error) {
      if (error.response) {
        logger.error('AI service error:', error.response.data);
        throw new APIError('Failed to search exercises', 500);
      }
      throw error;
    }
  })
);

/**
 * @route GET /api/workouts/plans
 * @desc Get user's workout plans
 * @access Private
 */
router.get('/plans',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    try {
      const { data: plans, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          workout_sessions (
            id,
            name,
            category,
            duration_minutes,
            status,
            scheduled_date,
            completed_date
          )
        `)
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching workout plans:', error);
        throw new APIError('Failed to fetch workout plans', 500);
      }

      res.json({
        success: true,
        message: 'Workout plans retrieved successfully',
        data: plans
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/workouts/plans/:planId
 * @desc Get specific workout plan with sessions
 * @access Private
 */
router.get('/plans/:planId',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const { planId } = req.params;
    const userId = req.user.id;

    try {
      const { data: plan, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          workout_sessions (*)
        `)
        .eq('id', planId)
        .eq('user_id', userId)
        .single();

      if (error || !plan) {
        throw new APIError('Workout plan not found', 404);
      }

      res.json({
        success: true,
        message: 'Workout plan retrieved successfully',
        data: plan
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/workouts/log
 * @desc Log a completed workout session
 * @access Private
 */
router.post('/log',
  requireActiveMembership,
  logWorkoutValidation,
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const {
      session_id,
      duration_minutes,
      calories_burned,
      exercises,
      rating,
      notes
    } = req.body;
    const userId = req.user.id;

    try {
      // Log the workout
      const { data: loggedWorkout, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId,
          session_id,
          duration_minutes,
          calories_burned,
          exercises,
          rating,
          notes,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error logging workout:', error);
        throw new APIError('Failed to log workout', 500);
      }

      // Update session status if it exists
      if (session_id) {
        await supabase
          .from('workout_sessions')
          .update({
            status: 'completed',
            completed_date: new Date().toISOString()
          })
          .eq('id', session_id)
          .eq('user_id', userId);
      }

      // Update user stats
      await updateUserWorkoutStats(userId, duration_minutes, calories_burned);

      res.json({
        success: true,
        message: 'Workout logged successfully',
        data: loggedWorkout
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/workouts/history
 * @desc Get user's workout history
 * @access Private
 */
router.get('/history',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    try {
      const { data: workouts, error } = await supabase
        .from('workout_logs')
        .select(`
          *,
          workout_sessions (
            name,
            category,
            target_muscle_groups
          )
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error fetching workout history:', error);
        throw new APIError('Failed to fetch workout history', 500);
      }

      res.json({
        success: true,
        message: 'Workout history retrieved successfully',
        data: workouts
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/workouts/stats
 * @desc Get user's workout statistics
 * @access Private
 */
router.get('/stats',
  requireActiveMembership,
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

      // Get workout logs for period
      const { data: workouts, error } = await supabase
        .from('workout_logs')
        .select('duration_minutes, calories_burned, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      if (error) {
        logger.error('Error fetching workout stats:', error);
        throw new APIError('Failed to fetch workout stats', 500);
      }

      // Calculate statistics
      const stats = {
        total_workouts: workouts.length,
        total_duration_minutes: workouts.reduce((sum, w) => sum + w.duration_minutes, 0),
        total_calories_burned: workouts.reduce((sum, w) => sum + w.calories_burned, 0),
        average_duration_minutes: workouts.length > 0 ? 
          Math.round(workouts.reduce((sum, w) => sum + w.duration_minutes, 0) / workouts.length) : 0,
        average_calories_per_workout: workouts.length > 0 ?
          Math.round(workouts.reduce((sum, w) => sum + w.calories_burned, 0) / workouts.length) : 0,
        workouts_this_week: workouts.filter(w => {
          const workoutDate = new Date(w.completed_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return workoutDate >= weekAgo;
        }).length
      };

      res.json({
        success: true,
        message: 'Workout statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/workouts/sessions/:sessionId/schedule
 * @desc Schedule a workout session
 * @access Private
 */
router.put('/sessions/:sessionId/schedule',
  requireActiveMembership,
  [
    body('scheduled_date').isISO8601().withMessage('Scheduled date must be a valid date')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { scheduled_date } = req.body;
    const userId = req.user.id;

    try {
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .update({
          scheduled_date,
          status: 'scheduled'
        })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !session) {
        throw new APIError('Workout session not found', 404);
      }

      res.json({
        success: true,
        message: 'Workout session scheduled successfully',
        data: session
      });

    } catch (error) {
      throw error;
    }
  })
);

// Helper function to update user workout stats
async function updateUserWorkoutStats(userId, durationMinutes, caloriesBurned) {
  try {
    // Get current stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_workouts, total_workout_minutes, total_calories_burned')
      .eq('id', userId)
      .single();

    if (userError) {
      logger.error('Error fetching user stats:', userError);
      return;
    }

    // Update stats
    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_workouts: (user.total_workouts || 0) + 1,
        total_workout_minutes: (user.total_workout_minutes || 0) + durationMinutes,
        total_calories_burned: (user.total_calories_burned || 0) + caloriesBurned,
        last_workout_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Error updating user stats:', updateError);
    }

  } catch (error) {
    logger.error('Error in updateUserWorkoutStats:', error);
  }
}

module.exports = router;