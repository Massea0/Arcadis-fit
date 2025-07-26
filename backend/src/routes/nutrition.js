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

const NUTRITION_AI_URL = process.env.NUTRITION_AI_URL || 'http://localhost:8001';

// Validation schemas
const generateMealPlanValidation = [
  body('target_calories').optional().isInt({ min: 1200, max: 5000 }).withMessage('Target calories must be between 1200 and 5000'),
  body('target_protein').optional().isInt({ min: 50, max: 300 }).withMessage('Target protein must be between 50 and 300g'),
  body('target_carbs').optional().isInt({ min: 100, max: 500 }).withMessage('Target carbs must be between 100 and 500g'),
  body('target_fat').optional().isInt({ min: 30, max: 150 }).withMessage('Target fat must be between 30 and 150g'),
  body('days').isInt({ min: 1, max: 14 }).withMessage('Days must be between 1 and 14'),
  body('include_senegalese').isBoolean().withMessage('Include Senegalese must be a boolean'),
  body('meal_types').isArray().withMessage('Meal types must be an array')
];

const logMealValidation = [
  body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('foods').isArray().withMessage('Foods must be an array'),
  body('total_calories').isFloat({ min: 0 }).withMessage('Total calories must be positive'),
  body('total_protein').isFloat({ min: 0 }).withMessage('Total protein must be positive'),
  body('total_carbs').isFloat({ min: 0 }).withMessage('Total carbs must be positive'),
  body('total_fat').isFloat({ min: 0 }).withMessage('Total fat must be positive'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

/**
 * @route POST /api/nutrition/generate-meal-plan
 * @desc Generate personalized meal plan using AI
 * @access Private
 */
router.post('/generate-meal-plan',
  requireActiveMembership,
  generateMealPlanValidation,
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { 
      target_calories, 
      target_protein, 
      target_carbs, 
      target_fat, 
      days, 
      include_senegalese, 
      meal_types 
    } = req.body;
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
        activity_level: user.activity_level || 'moderate',
        fitness_goals: user.fitness_goals || ['general_fitness'],
        dietary_restrictions: user.dietary_restrictions || [],
        allergies: user.allergies || [],
        preferences: user.nutrition_preferences || {},
        language: user.language_preference || 'fr'
      };

      // Call AI service
      const aiResponse = await axios.post(`${NUTRITION_AI_URL}/generate-meal-plan`, {
        user_profile: userProfile,
        target_calories,
        target_protein,
        target_carbs,
        target_fat,
        days,
        include_senegalese,
        meal_types
      });

      const mealPlan = aiResponse.data;

      // Save meal plan to database
      const { data: savedPlan, error: saveError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          name: `Plan de repas ${days} jours`,
          start_date: mealPlan.start_date,
          end_date: mealPlan.end_date,
          target_calories: mealPlan.target_calories,
          target_protein: mealPlan.target_protein,
          target_carbs: mealPlan.target_carbs,
          target_fat: mealPlan.target_fat,
          total_cost_xof: mealPlan.total_cost_xof,
          shopping_list: mealPlan.shopping_list,
          nutrition_summary: mealPlan.nutrition_summary,
          status: 'active'
        })
        .select()
        .single();

      if (saveError) {
        logger.error('Error saving meal plan:', saveError);
        throw new APIError('Failed to save meal plan', 500);
      }

      // Save individual meals
      const mealsToInsert = mealPlan.meals.map(meal => ({
        meal_plan_id: savedPlan.id,
        user_id: userId,
        date: meal.date,
        meal_type: meal.meal_type,
        target_calories: meal.target_calories,
        foods: meal.foods,
        total_calories: meal.total_calories,
        notes: meal.notes,
        status: 'pending'
      }));

      const { error: mealsError } = await supabase
        .from('meal_sessions')
        .insert(mealsToInsert);

      if (mealsError) {
        logger.error('Error saving meal sessions:', mealsError);
        throw new APIError('Failed to save meal sessions', 500);
      }

      res.json({
        success: true,
        message: 'Meal plan generated successfully',
        data: {
          plan: savedPlan,
          meals: mealPlan.meals
        }
      });

    } catch (error) {
      if (error.response) {
        // AI service error
        logger.error('AI service error:', error.response.data);
        throw new APIError('Failed to generate meal plan', 500);
      }
      throw error;
    }
  })
);

/**
 * @route POST /api/nutrition/recommendations
 * @desc Get personalized nutrition recommendations
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
        activity_level: user.activity_level || 'moderate',
        fitness_goals: user.fitness_goals || ['general_fitness'],
        dietary_restrictions: user.dietary_restrictions || [],
        allergies: user.allergies || [],
        preferences: user.nutrition_preferences || {},
        language: user.language_preference || 'fr'
      };

      // Call AI service
      const aiResponse = await axios.post(`${NUTRITION_AI_URL}/nutrition-recommendations`, userProfile);

      res.json({
        success: true,
        message: 'Nutrition recommendations retrieved successfully',
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
 * @route GET /api/nutrition/senegalese-foods
 * @desc Get Senegalese food database
 * @access Private
 */
router.get('/senegalese-foods',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const { category } = req.query;

    try {
      // Call AI service
      const aiResponse = await axios.get(`${NUTRITION_AI_URL}/senegalese-foods`, {
        params: { category }
      });

      res.json({
        success: true,
        message: 'Senegalese foods retrieved successfully',
        data: aiResponse.data
      });

    } catch (error) {
      if (error.response) {
        logger.error('AI service error:', error.response.data);
        throw new APIError('Failed to get Senegalese foods', 500);
      }
      throw error;
    }
  })
);

/**
 * @route POST /api/nutrition/search-foods
 * @desc Search for foods in the database
 * @access Private
 */
router.post('/search-foods',
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
      const aiResponse = await axios.post(`${NUTRITION_AI_URL}/food-search`, {
        query,
        language
      });

      res.json({
        success: true,
        message: 'Food search completed successfully',
        data: aiResponse.data
      });

    } catch (error) {
      if (error.response) {
        logger.error('AI service error:', error.response.data);
        throw new APIError('Failed to search foods', 500);
      }
      throw error;
    }
  })
);

/**
 * @route GET /api/nutrition/plans
 * @desc Get user's meal plans
 * @access Private
 */
router.get('/plans',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    try {
      const { data: plans, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_sessions (
            id,
            date,
            meal_type,
            target_calories,
            total_calories,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching meal plans:', error);
        throw new APIError('Failed to fetch meal plans', 500);
      }

      res.json({
        success: true,
        message: 'Meal plans retrieved successfully',
        data: plans
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/nutrition/plans/:planId
 * @desc Get specific meal plan with sessions
 * @access Private
 */
router.get('/plans/:planId',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const { planId } = req.params;
    const userId = req.user.id;

    try {
      const { data: plan, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_sessions (*)
        `)
        .eq('id', planId)
        .eq('user_id', userId)
        .single();

      if (error || !plan) {
        throw new APIError('Meal plan not found', 404);
      }

      res.json({
        success: true,
        message: 'Meal plan retrieved successfully',
        data: plan
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/nutrition/log
 * @desc Log a consumed meal
 * @access Private
 */
router.post('/log',
  requireActiveMembership,
  logMealValidation,
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const {
      meal_type,
      foods,
      total_calories,
      total_protein,
      total_carbs,
      total_fat,
      notes
    } = req.body;
    const userId = req.user.id;

    try {
      // Log the meal
      const { data: loggedMeal, error } = await supabase
        .from('nutrition_logs')
        .insert({
          user_id: userId,
          meal_type,
          foods,
          total_calories,
          total_protein,
          total_carbs,
          total_fat,
          notes,
          consumed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error logging meal:', error);
        throw new APIError('Failed to log meal', 500);
      }

      // Update user stats
      await updateUserNutritionStats(userId, total_calories, total_protein, total_carbs, total_fat);

      res.json({
        success: true,
        message: 'Meal logged successfully',
        data: loggedMeal
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/nutrition/history
 * @desc Get user's nutrition history
 * @access Private
 */
router.get('/history',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20, offset = 0, meal_type } = req.query;

    try {
      let query = supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .order('consumed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (meal_type) {
        query = query.eq('meal_type', meal_type);
      }

      const { data: meals, error } = await query;

      if (error) {
        logger.error('Error fetching nutrition history:', error);
        throw new APIError('Failed to fetch nutrition history', 500);
      }

      res.json({
        success: true,
        message: 'Nutrition history retrieved successfully',
        data: meals
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/nutrition/stats
 * @desc Get user's nutrition statistics
 * @access Private
 */
router.get('/stats',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period = '7d' } = req.query;

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Get nutrition logs for period
      const { data: meals, error } = await supabase
        .from('nutrition_logs')
        .select('total_calories, total_protein, total_carbs, total_fat, consumed_at')
        .eq('user_id', userId)
        .gte('consumed_at', startDate.toISOString())
        .lte('consumed_at', endDate.toISOString());

      if (error) {
        logger.error('Error fetching nutrition stats:', error);
        throw new APIError('Failed to fetch nutrition stats', 500);
      }

      // Calculate statistics
      const stats = {
        total_meals: meals.length,
        total_calories: meals.reduce((sum, m) => sum + m.total_calories, 0),
        total_protein: meals.reduce((sum, m) => sum + m.total_protein, 0),
        total_carbs: meals.reduce((sum, m) => sum + m.total_carbs, 0),
        total_fat: meals.reduce((sum, m) => sum + m.total_fat, 0),
        average_calories_per_meal: meals.length > 0 ?
          Math.round(meals.reduce((sum, m) => sum + m.total_calories, 0) / meals.length) : 0,
        meals_today: meals.filter(m => {
          const mealDate = new Date(m.consumed_at);
          const today = new Date();
          return mealDate.toDateString() === today.toDateString();
        }).length
      };

      res.json({
        success: true,
        message: 'Nutrition statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/nutrition/daily-goals
 * @desc Get user's daily nutrition goals
 * @access Private
 */
router.get('/daily-goals',
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

      // Calculate daily goals based on user profile
      const goals = calculateDailyNutritionGoals(user);

      res.json({
        success: true,
        message: 'Daily nutrition goals retrieved successfully',
        data: goals
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/nutrition/daily-progress
 * @desc Get user's daily nutrition progress
 * @access Private
 */
router.get('/daily-progress',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query;

    try {
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get meals for the day
      const { data: meals, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('consumed_at', startOfDay.toISOString())
        .lte('consumed_at', endOfDay.toISOString());

      if (error) {
        logger.error('Error fetching daily progress:', error);
        throw new APIError('Failed to fetch daily progress', 500);
      }

      // Calculate daily totals
      const dailyTotals = {
        calories: meals.reduce((sum, m) => sum + m.total_calories, 0),
        protein: meals.reduce((sum, m) => sum + m.total_protein, 0),
        carbs: meals.reduce((sum, m) => sum + m.total_carbs, 0),
        fat: meals.reduce((sum, m) => sum + m.total_fat, 0)
      };

      // Get user goals
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const goals = calculateDailyNutritionGoals(user);

      // Calculate progress percentages
      const progress = {
        calories: Math.round((dailyTotals.calories / goals.calories) * 100),
        protein: Math.round((dailyTotals.protein / goals.protein) * 100),
        carbs: Math.round((dailyTotals.carbs / goals.carbs) * 100),
        fat: Math.round((dailyTotals.fat / goals.fat) * 100)
      };

      res.json({
        success: true,
        message: 'Daily nutrition progress retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          goals,
          consumed: dailyTotals,
          progress,
          meals
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

// Helper function to calculate daily nutrition goals
function calculateDailyNutritionGoals(user) {
  // Basic BMR calculation (Mifflin-St Jeor Equation)
  let bmr;
  if (user.gender === 'male') {
    bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5;
  } else {
    bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age - 161;
  }

  // Activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const tdee = bmr * activityMultipliers[user.activity_level || 'moderate'];

  // Adjust based on fitness goals
  let targetCalories = tdee;
  if (user.fitness_goals && user.fitness_goals.includes('weight_loss')) {
    targetCalories = tdee - 500;
  } else if (user.fitness_goals && user.fitness_goals.includes('muscle_gain')) {
    targetCalories = tdee + 300;
  }

  // Calculate macronutrient targets
  const proteinRatio = 0.25; // 25% of calories
  const fatRatio = 0.30;     // 30% of calories
  const carbsRatio = 0.45;   // 45% of calories

  return {
    calories: Math.round(targetCalories),
    protein: Math.round((targetCalories * proteinRatio) / 4), // 4 cal/g
    carbs: Math.round((targetCalories * carbsRatio) / 4),     // 4 cal/g
    fat: Math.round((targetCalories * fatRatio) / 9)          // 9 cal/g
  };
}

// Helper function to update user nutrition stats
async function updateUserNutritionStats(userId, calories, protein, carbs, fat) {
  try {
    // Get current stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_meals, total_calories_consumed, total_protein_consumed, total_carbs_consumed, total_fat_consumed')
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
        total_meals: (user.total_meals || 0) + 1,
        total_calories_consumed: (user.total_calories_consumed || 0) + calories,
        total_protein_consumed: (user.total_protein_consumed || 0) + protein,
        total_carbs_consumed: (user.total_carbs_consumed || 0) + carbs,
        total_fat_consumed: (user.total_fat_consumed || 0) + fat,
        last_meal_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Error updating user stats:', updateError);
    }

  } catch (error) {
    logger.error('Error in updateUserNutritionStats:', error);
  }
}

module.exports = router;