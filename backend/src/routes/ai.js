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
const WORKOUT_AI_URL = process.env.WORKOUT_AI_URL || 'http://localhost:8002';

// Validation schemas
const aiRecommendationValidation = [
  body('type').isIn(['workout', 'nutrition', 'general']).withMessage('Invalid recommendation type'),
  body('context').optional().isObject().withMessage('Context must be an object'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
];

/**
 * @route GET /api/ai/health
 * @desc Check AI services health
 * @access Private
 */
router.get('/health',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    try {
      const healthChecks = {};

      // Check Nutrition AI service
      try {
        const nutritionResponse = await axios.get(`${NUTRITION_AI_URL}/health`, {
          timeout: 5000
        });
        healthChecks.nutrition_ai = {
          status: 'healthy',
          response_time: nutritionResponse.headers['x-response-time'] || 'unknown',
          models_loaded: nutritionResponse.data.models_loaded || false
        };
      } catch (error) {
        healthChecks.nutrition_ai = {
          status: 'unhealthy',
          error: error.message
        };
      }

      // Check Workout AI service
      try {
        const workoutResponse = await axios.get(`${WORKOUT_AI_URL}/health`, {
          timeout: 5000
        });
        healthChecks.workout_ai = {
          status: 'healthy',
          response_time: workoutResponse.headers['x-response-time'] || 'unknown',
          models_loaded: workoutResponse.data.models_loaded || false
        };
      } catch (error) {
        healthChecks.workout_ai = {
          status: 'unhealthy',
          error: error.message
        };
      }

      const overallStatus = Object.values(healthChecks).every(check => check.status === 'healthy') ? 'healthy' : 'degraded';

      res.json({
        success: true,
        message: 'AI services health check completed',
        data: {
          overall_status: overallStatus,
          services: healthChecks,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/ai/recommendations
 * @desc Get AI-powered recommendations
 * @access Private
 */
router.post('/recommendations',
  requireActiveMembership,
  aiRecommendationValidation,
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type, context = {}, preferences = {} } = req.body;

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

      const recommendations = {};

      // Get workout recommendations if requested
      if (type === 'workout' || type === 'general') {
        try {
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
            preferences: { ...user.workout_preferences, ...preferences },
            language: user.language_preference || 'fr'
          };

          const workoutResponse = await axios.post(`${WORKOUT_AI_URL}/workout-recommendations`, userProfile);
          recommendations.workout = workoutResponse.data;
        } catch (error) {
          logger.error('Error getting workout recommendations:', error);
          recommendations.workout = {
            error: 'Failed to get workout recommendations',
            recommendations: []
          };
        }
      }

      // Get nutrition recommendations if requested
      if (type === 'nutrition' || type === 'general') {
        try {
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
            preferences: { ...user.nutrition_preferences, ...preferences },
            language: user.language_preference || 'fr'
          };

          const nutritionResponse = await axios.post(`${NUTRITION_AI_URL}/nutrition-recommendations`, userProfile);
          recommendations.nutrition = nutritionResponse.data;
        } catch (error) {
          logger.error('Error getting nutrition recommendations:', error);
          recommendations.nutrition = {
            error: 'Failed to get nutrition recommendations',
            recommendations: []
          };
        }
      }

      // Generate personalized insights
      const insights = await generatePersonalizedInsights(user, context);

      res.json({
        success: true,
        message: 'AI recommendations generated successfully',
        data: {
          recommendations,
          insights,
          user_context: {
            fitness_level: user.fitness_level,
            fitness_goals: user.fitness_goals,
            recent_activity: context.recent_activity || 'none'
          }
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/ai/chat
 * @desc AI-powered fitness chat assistant
 * @access Private
 */
router.post('/chat',
  requireActiveMembership,
  [
    body('message').isString().notEmpty().withMessage('Message is required'),
    body('context').optional().isObject().withMessage('Context must be an object')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { message, context = {} } = req.body;

    try {
      // Get user profile for context
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new APIError('User not found', 404);
      }

      // Analyze message intent
      const intent = analyzeMessageIntent(message);
      
      let response = {
        message: '',
        recommendations: [],
        actions: []
      };

      // Generate response based on intent
      switch (intent.type) {
        case 'workout_help':
          response = await generateWorkoutHelpResponse(user, message, context);
          break;
        case 'nutrition_help':
          response = await generateNutritionHelpResponse(user, message, context);
          break;
        case 'motivation':
          response = await generateMotivationResponse(user, context);
          break;
        case 'progress_tracking':
          response = await generateProgressResponse(user, context);
          break;
        default:
          response = await generateGeneralResponse(user, message, context);
      }

      // Save chat interaction for learning
      await saveChatInteraction(userId, message, response, intent);

      res.json({
        success: true,
        message: 'AI response generated successfully',
        data: {
          response,
          intent,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/ai/insights
 * @desc Get AI-powered fitness insights
 * @access Private
 */
router.get('/insights',
  requireActiveMembership,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    try {
      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new APIError('User not found', 404);
      }

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

      // Get user activity data
      const insights = await generateComprehensiveInsights(userId, startDate, endDate, user);

      res.json({
        success: true,
        message: 'AI insights generated successfully',
        data: insights
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/ai/feedback
 * @desc Submit feedback for AI recommendations
 * @access Private
 */
router.post('/feedback',
  requireActiveMembership,
  [
    body('recommendation_id').isString().notEmpty().withMessage('Recommendation ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').optional().isString().withMessage('Feedback must be a string'),
    body('action_taken').optional().isString().withMessage('Action taken must be a string')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { recommendation_id, rating, feedback, action_taken } = req.body;

    try {
      // Save feedback
      const { data: savedFeedback, error } = await supabase
        .from('ai_feedback')
        .insert({
          user_id: userId,
          recommendation_id,
          rating,
          feedback,
          action_taken,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving AI feedback:', error);
        throw new APIError('Failed to save feedback', 500);
      }

      res.json({
        success: true,
        message: 'Feedback submitted successfully',
        data: savedFeedback
      });

    } catch (error) {
      throw error;
    }
  })
);

// Helper functions

async function generatePersonalizedInsights(user, context) {
  const insights = [];

  // Analyze workout patterns
  if (user.total_workouts > 0) {
    const avgWorkoutDuration = user.total_workout_minutes / user.total_workouts;
    
    if (avgWorkoutDuration < 30) {
      insights.push({
        type: 'workout_duration',
        title: 'Augmentez la durée de vos entraînements',
        message: 'Vos entraînements sont courts. Essayez d\'atteindre au moins 30-45 minutes pour de meilleurs résultats.',
        priority: 'medium'
      });
    }

    if (user.total_workouts < 3) {
      insights.push({
        type: 'workout_frequency',
        title: 'Entraînez-vous plus régulièrement',
        message: 'Vous faites moins de 3 entraînements par semaine. Augmentez la fréquence pour de meilleurs résultats.',
        priority: 'high'
      });
    }
  }

  // Analyze nutrition patterns
  if (user.total_meals > 0) {
    const avgCaloriesPerMeal = user.total_calories_consumed / user.total_meals;
    
    if (avgCaloriesPerMeal < 300) {
      insights.push({
        type: 'nutrition_calories',
        title: 'Augmentez votre apport calorique',
        message: 'Vos repas semblent trop légers. Assurez-vous de consommer suffisamment de calories.',
        priority: 'medium'
      });
    }
  }

  // Check for consistency
  const lastWorkout = user.last_workout_date ? new Date(user.last_workout_date) : null;
  const lastMeal = user.last_meal_date ? new Date(user.last_meal_date) : null;
  const now = new Date();

  if (lastWorkout && (now - lastWorkout) > 7 * 24 * 60 * 60 * 1000) {
    insights.push({
      type: 'inactivity',
      title: 'Reprenez vos entraînements',
      message: 'Cela fait plus d\'une semaine que vous n\'avez pas fait d\'exercice. Reprenez doucement !',
      priority: 'high'
    });
  }

  return insights;
}

function analyzeMessageIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Workout-related keywords
  const workoutKeywords = ['entraînement', 'exercice', 'musculation', 'cardio', 'sport', 'gym'];
  const nutritionKeywords = ['nutrition', 'alimentation', 'repas', 'calories', 'protéines', 'régime'];
  const motivationKeywords = ['motivation', 'encouragement', 'défis', 'objectifs'];
  const progressKeywords = ['progrès', 'résultats', 'suivi', 'statistiques'];

  if (workoutKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return { type: 'workout_help', confidence: 0.8 };
  }
  
  if (nutritionKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return { type: 'nutrition_help', confidence: 0.8 };
  }
  
  if (motivationKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return { type: 'motivation', confidence: 0.7 };
  }
  
  if (progressKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return { type: 'progress_tracking', confidence: 0.7 };
  }

  return { type: 'general', confidence: 0.5 };
}

async function generateWorkoutHelpResponse(user, message, context) {
  const responses = [
    {
      message: "Je peux vous aider avec vos entraînements ! Voici quelques suggestions :",
      recommendations: [
        "Générer un plan d'entraînement personnalisé",
        "Trouver des exercices adaptés à votre niveau",
        "Planifier vos séances de la semaine"
      ],
      actions: [
        { type: 'generate_workout_plan', label: 'Créer un plan d\'entraînement' },
        { type: 'find_exercises', label: 'Rechercher des exercices' }
      ]
    }
  ];

  return responses[0];
}

async function generateNutritionHelpResponse(user, message, context) {
  const responses = [
    {
      message: "Je peux vous aider avec votre nutrition ! Voici mes suggestions :",
      recommendations: [
        "Générer un plan de repas personnalisé",
        "Calculer vos besoins caloriques",
        "Trouver des recettes sénégalaises"
      ],
      actions: [
        { type: 'generate_meal_plan', label: 'Créer un plan de repas' },
        { type: 'calculate_calories', label: 'Calculer mes besoins' }
      ]
    }
  ];

  return responses[0];
}

async function generateMotivationResponse(user, context) {
  const motivationalMessages = [
    "Chaque pas compte ! Vous êtes sur la bonne voie.",
    "La persévérance est la clé du succès. Continuez !",
    "Votre corps peut le faire. C'est votre esprit qu'il faut convaincre.",
    "Les champions ne sont pas nés, ils sont créés par l'effort quotidien."
  ];

  return {
    message: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
    recommendations: [
      "Fixez-vous des objectifs réalistes",
      "Célébrez vos petites victoires",
      "Trouvez un partenaire d'entraînement"
    ],
    actions: []
  };
}

async function generateProgressResponse(user, context) {
  return {
    message: "Voici un aperçu de vos progrès :",
    recommendations: [
      "Consultez vos statistiques détaillées",
      "Comparez avec vos objectifs",
      "Ajustez votre plan si nécessaire"
    ],
    actions: [
      { type: 'view_stats', label: 'Voir mes statistiques' },
      { type: 'set_goals', label: 'Définir des objectifs' }
    ]
  };
}

async function generateGeneralResponse(user, message, context) {
  return {
    message: "Je suis là pour vous aider dans votre parcours fitness ! Que puis-je faire pour vous ?",
    recommendations: [
      "Générer des recommandations personnalisées",
      "Créer un plan d'entraînement",
      "Planifier vos repas"
    ],
    actions: [
      { type: 'get_recommendations', label: 'Obtenir des recommandations' },
      { type: 'start_workout', label: 'Commencer un entraînement' }
    ]
  };
}

async function saveChatInteraction(userId, message, response, intent) {
  try {
    await supabase
      .from('ai_chat_interactions')
      .insert({
        user_id: userId,
        user_message: message,
        ai_response: response.message,
        intent_type: intent.type,
        intent_confidence: intent.confidence,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    logger.error('Error saving chat interaction:', error);
  }
}

async function generateComprehensiveInsights(userId, startDate, endDate, user) {
  try {
    // Get workout data
    const { data: workouts } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    // Get nutrition data
    const { data: meals } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('consumed_at', startDate.toISOString())
      .lte('consumed_at', endDate.toISOString());

    const insights = {
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        days: Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      workout_insights: {
        total_sessions: workouts?.length || 0,
        total_duration: workouts?.reduce((sum, w) => sum + w.duration_minutes, 0) || 0,
        total_calories_burned: workouts?.reduce((sum, w) => sum + w.calories_burned, 0) || 0,
        average_session_duration: workouts?.length > 0 ? 
          Math.round(workouts.reduce((sum, w) => sum + w.duration_minutes, 0) / workouts.length) : 0,
        consistency_score: calculateConsistencyScore(workouts, startDate, endDate)
      },
      nutrition_insights: {
        total_meals: meals?.length || 0,
        total_calories_consumed: meals?.reduce((sum, m) => sum + m.total_calories, 0) || 0,
        average_calories_per_meal: meals?.length > 0 ?
          Math.round(meals.reduce((sum, m) => sum + m.total_calories, 0) / meals.length) : 0,
        meal_variety_score: calculateMealVarietyScore(meals)
      },
      recommendations: generatePeriodRecommendations(workouts, meals, user)
    };

    return insights;

  } catch (error) {
    logger.error('Error generating comprehensive insights:', error);
    return {
      error: 'Failed to generate insights',
      period: { start_date: startDate.toISOString(), end_date: endDate.toISOString() }
    };
  }
}

function calculateConsistencyScore(workouts, startDate, endDate) {
  if (!workouts || workouts.length === 0) return 0;

  const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  const workoutDays = new Set(workouts.map(w => new Date(w.completed_at).toDateString())).size;
  
  return Math.round((workoutDays / totalDays) * 100);
}

function calculateMealVarietyScore(meals) {
  if (!meals || meals.length === 0) return 0;

  const uniqueFoods = new Set();
  meals.forEach(meal => {
    if (meal.foods) {
      meal.foods.forEach(food => {
        if (food.name) uniqueFoods.add(food.name);
      });
    }
  });

  return Math.min(100, uniqueFoods.size * 10); // 10 points per unique food, max 100
}

function generatePeriodRecommendations(workouts, meals, user) {
  const recommendations = [];

  // Workout recommendations
  if (!workouts || workouts.length === 0) {
    recommendations.push({
      type: 'workout',
      priority: 'high',
      title: 'Commencez à vous entraîner',
      message: 'Vous n\'avez pas encore fait d\'entraînement. Commencez par des séances courtes et progressives.'
    });
  } else if (workouts.length < 3) {
    recommendations.push({
      type: 'workout',
      priority: 'medium',
      title: 'Augmentez la fréquence',
      message: 'Essayez de faire au moins 3 entraînements par semaine pour de meilleurs résultats.'
    });
  }

  // Nutrition recommendations
  if (!meals || meals.length === 0) {
    recommendations.push({
      type: 'nutrition',
      priority: 'high',
      title: 'Suivez votre alimentation',
      message: 'Commencez à enregistrer vos repas pour mieux comprendre vos habitudes alimentaires.'
    });
  }

  return recommendations;
}

module.exports = router;