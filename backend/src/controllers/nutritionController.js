// Contrôleur pour la gestion de la nutrition
const supabase = require('../utils/supabase');

// Logger simple pour éviter les imports circulaires
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};

/**
 * Ajouter un repas au journal nutritionnel
 */
const logMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      meal_type,
      meal_name,
      meal_date,
      meal_time,
      calories,
      proteins_g,
      carbs_g,
      fats_g,
      fiber_g,
      sugar_g,
      sodium_mg,
      ingredients,
      portion_size,
      preparation_method,
      location,
      image_url,
      notes,
      mood_rating,
      hunger_before,
      satisfaction_after
    } = req.body;

    logger.info(`Logging meal for user ${userId}: ${meal_name}`);

    const { data: meal, error } = await supabase
      .from('nutrition')
      .insert({
        user_id: userId,
        meal_type,
        meal_name,
        meal_date: meal_date || new Date().toISOString().split('T')[0],
        meal_time,
        calories: calories || 0,
        proteins_g: proteins_g || 0,
        carbs_g: carbs_g || 0,
        fats_g: fats_g || 0,
        fiber_g: fiber_g || 0,
        sugar_g: sugar_g || 0,
        sodium_mg: sodium_mg || 0,
        ingredients: ingredients || [],
        portion_size,
        preparation_method,
        location,
        image_url,
        notes,
        mood_rating,
        hunger_before,
        satisfaction_after,
        ai_analyzed: false
      })
      .select()
      .single();

    if (error) {
      logger.error('Log meal error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'enregistrement du repas'
      });
    }

    // Mettre à jour les statistiques quotidiennes
    await updateDailyNutritionStats(userId, meal_date || new Date().toISOString().split('T')[0]);

    res.json({
      success: true,
      message: 'Repas enregistré avec succès',
      data: meal
    });

  } catch (error) {
    logger.error('Log meal exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'enregistrement du repas'
    });
  }
};

/**
 * Obtenir le journal nutritionnel d'un utilisateur
 */
const getNutritionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      start_date, 
      end_date, 
      meal_type,
      limit = 50, 
      offset = 0 
    } = req.query;

    logger.info(`Getting nutrition history for user ${userId}`);

    let query = supabase
      .from('nutrition')
      .select(`
        id,
        meal_type,
        meal_name,
        meal_date,
        meal_time,
        calories,
        proteins_g,
        carbs_g,
        fats_g,
        fiber_g,
        sugar_g,
        sodium_mg,
        ingredients,
        portion_size,
        image_url,
        notes,
        mood_rating,
        hunger_before,
        satisfaction_after,
        ai_analyzed,
        ai_suggestions,
        created_at
      `)
      .eq('user_id', userId)
      .order('meal_date', { ascending: false })
      .order('meal_time', { ascending: false });

    // Filtres optionnels
    if (start_date) {
      query = query.gte('meal_date', start_date);
    }
    if (end_date) {
      query = query.lte('meal_date', end_date);
    }
    if (meal_type) {
      query = query.eq('meal_type', meal_type);
    }

    // Pagination
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: meals, error } = await query;

    if (error) {
      logger.error('Get nutrition history error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique'
      });
    }

    res.json({
      success: true,
      data: {
        meals,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: meals.length
        }
      }
    });

  } catch (error) {
    logger.error('Get nutrition history exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'historique'
    });
  }
};

/**
 * Obtenir les statistiques nutritionnelles
 */
const getNutritionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '7d', date } = req.query;

    logger.info(`Getting nutrition stats for user ${userId}, period: ${period}`);

    // Calculer la plage de dates
    const endDate = date ? new Date(date) : new Date();
    const startDate = new Date(endDate);
    
    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate());
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 6);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 29);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 89);
        break;
      default:
        startDate.setDate(endDate.getDate() - 6);
    }

    const { data: meals, error } = await supabase
      .from('nutrition')
      .select(`
        meal_date,
        calories,
        proteins_g,
        carbs_g,
        fats_g,
        fiber_g,
        sugar_g,
        sodium_mg,
        meal_type
      `)
      .eq('user_id', userId)
      .gte('meal_date', startDate.toISOString().split('T')[0])
      .lte('meal_date', endDate.toISOString().split('T')[0]);

    if (error) {
      logger.error('Get nutrition stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul des statistiques'
      });
    }

    // Calculer les statistiques
    const stats = calculateNutritionStats(meals, period);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Get nutrition stats exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du calcul des statistiques'
    });
  }
};

/**
 * Analyser un repas avec l'IA
 */
const analyzeFood = async (req, res) => {
  try {
    const { image_url, description } = req.body;

    logger.info('Analyzing food with AI');

    // TODO: Intégrer avec le service IA de nutrition
    // Pour l'instant, retourner des données mockées
    const mockAnalysis = {
      food_items: [
        {
          name: 'Riz au poisson',
          confidence: 0.85,
          calories: 450,
          proteins_g: 25,
          carbs_g: 60,
          fats_g: 12,
          portion_estimate: '1 assiette moyenne'
        }
      ],
      total_nutrition: {
        calories: 450,
        proteins_g: 25,
        carbs_g: 60,
        fats_g: 12,
        fiber_g: 3,
        sugar_g: 5,
        sodium_mg: 800
      },
      suggestions: [
        'Excellente source de protéines',
        'Considérez ajouter des légumes verts',
        'Portion équilibrée pour un repas principal'
      ],
      confidence: 0.85
    };

    res.json({
      success: true,
      message: 'Analyse alimentaire complétée',
      data: mockAnalysis
    });

  } catch (error) {
    logger.error('Analyze food exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse alimentaire'
    });
  }
};

/**
 * Obtenir les recommandations nutritionnelles personnalisées
 */
const getNutritionRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Getting nutrition recommendations for user ${userId}`);

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      logger.error('Get profile error:', profileError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du profil'
      });
    }

    // Récupérer les statistiques récentes
    const { data: recentMeals, error: mealsError } = await supabase
      .from('nutrition')
      .select('calories, proteins_g, carbs_g, fats_g, meal_date')
      .eq('user_id', userId)
      .gte('meal_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('meal_date', { ascending: false });

    if (mealsError) {
      logger.warn('Could not get recent meals for recommendations');
    }

    // Générer des recommandations basées sur le profil
    const recommendations = generateNutritionRecommendations(profile, recentMeals || []);

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    logger.error('Get nutrition recommendations exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des recommandations'
    });
  }
};

/**
 * Mettre à jour un repas
 */
const updateMeal = async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    logger.info(`Updating meal ${mealId} for user ${userId}`);

    const { data: meal, error } = await supabase
      .from('nutrition')
      .update(updateData)
      .eq('id', mealId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Update meal error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du repas'
      });
    }

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: 'Repas non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Repas mis à jour avec succès',
      data: meal
    });

  } catch (error) {
    logger.error('Update meal exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour'
    });
  }
};

/**
 * Supprimer un repas
 */
const deleteMeal = async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.id;

    logger.info(`Deleting meal ${mealId} for user ${userId}`);

    const { error } = await supabase
      .from('nutrition')
      .delete()
      .eq('id', mealId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Delete meal error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du repas'
      });
    }

    res.json({
      success: true,
      message: 'Repas supprimé avec succès'
    });

  } catch (error) {
    logger.error('Delete meal exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression'
    });
  }
};

// Fonctions utilitaires

/**
 * Mettre à jour les statistiques nutritionnelles quotidiennes
 */
async function updateDailyNutritionStats(userId, date) {
  try {
    const { data: dayMeals, error } = await supabase
      .from('nutrition')
      .select('calories, proteins_g, carbs_g, fats_g')
      .eq('user_id', userId)
      .eq('meal_date', date);

    if (error) {
      logger.error('Error fetching day meals for stats:', error);
      return;
    }

    const dailyTotals = dayMeals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      proteins_g: totals.proteins_g + (meal.proteins_g || 0),
      carbs_g: totals.carbs_g + (meal.carbs_g || 0),
      fats_g: totals.fats_g + (meal.fats_g || 0)
    }), { calories: 0, proteins_g: 0, carbs_g: 0, fats_g: 0 });

    logger.info(`Daily nutrition totals for ${date}:`, dailyTotals);

  } catch (error) {
    logger.error('Error updating daily nutrition stats:', error);
  }
}

/**
 * Calculer les statistiques nutritionnelles
 */
function calculateNutritionStats(meals, period) {
  const totalMeals = meals.length;
  
  if (totalMeals === 0) {
    return {
      period,
      total_meals: 0,
      daily_averages: {
        calories: 0,
        proteins_g: 0,
        carbs_g: 0,
        fats_g: 0
      },
      meal_distribution: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0
      }
    };
  }

  // Calculer les totaux
  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    proteins_g: acc.proteins_g + (meal.proteins_g || 0),
    carbs_g: acc.carbs_g + (meal.carbs_g || 0),
    fats_g: acc.fats_g + (meal.fats_g || 0)
  }), { calories: 0, proteins_g: 0, carbs_g: 0, fats_g: 0 });

  // Calculer la distribution des repas
  const mealDistribution = meals.reduce((acc, meal) => {
    acc[meal.meal_type] = (acc[meal.meal_type] || 0) + 1;
    return acc;
  }, {});

  // Calculer le nombre de jours
  const uniqueDates = [...new Set(meals.map(meal => meal.meal_date))];
  const days = uniqueDates.length || 1;

  return {
    period,
    total_meals: totalMeals,
    days_tracked: days,
    daily_averages: {
      calories: Math.round(totals.calories / days),
      proteins_g: Math.round((totals.proteins_g / days) * 10) / 10,
      carbs_g: Math.round((totals.carbs_g / days) * 10) / 10,
      fats_g: Math.round((totals.fats_g / days) * 10) / 10
    },
    meal_distribution: {
      breakfast: mealDistribution.breakfast || 0,
      lunch: mealDistribution.lunch || 0,
      dinner: mealDistribution.dinner || 0,
      snack: mealDistribution.snack || 0
    },
    totals
  };
}

/**
 * Générer des recommandations nutritionnelles personnalisées
 */
function generateNutritionRecommendations(profile, recentMeals) {
  const recommendations = {
    daily_goals: {
      calories: 2000, // Défaut, à calculer selon le profil
      proteins_g: 150,
      carbs_g: 250,
      fats_g: 65
    },
    suggestions: [],
    local_foods: [
      'Thiéboudienne (riz au poisson)',
      'Yassa poulet',
      'Mafé (sauce d\'arachide)',
      'Caldou (ragoût de poisson)',
      'Légumes verts locaux (bissap, gombo)'
    ]
  };

  // Calculer les besoins caloriques selon le profil
  if (profile.weight_kg && profile.height_cm && profile.age) {
    const bmr = calculateBMR(profile.weight_kg, profile.height_cm, profile.age, profile.gender);
    recommendations.daily_goals.calories = Math.round(bmr * 1.5); // Facteur d'activité modéré
  }

  // Suggestions basées sur l'historique récent
  if (recentMeals.length > 0) {
    const avgCalories = recentMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0) / recentMeals.length;
    
    if (avgCalories < recommendations.daily_goals.calories * 0.8) {
      recommendations.suggestions.push('Augmentez votre apport calorique avec des aliments nutritifs');
    }
    
    if (avgCalories > recommendations.daily_goals.calories * 1.2) {
      recommendations.suggestions.push('Réduisez légèrement les portions ou choisissez des aliments moins caloriques');
    }
  }

  recommendations.suggestions.push('Privilégiez les aliments locaux riches en nutriments');
  recommendations.suggestions.push('Buvez au moins 8 verres d\'eau par jour');

  return recommendations;
}

/**
 * Calculer le métabolisme de base (BMR)
 */
function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

module.exports = {
  logMeal,
  getNutritionHistory,
  getNutritionStats,
  analyzeFood,
  getNutritionRecommendations,
  updateMeal,
  deleteMeal
};