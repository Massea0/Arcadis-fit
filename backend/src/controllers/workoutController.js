const { supabase } = require('../utils/supabase');
// Logger simple pour éviter les imports circulaires
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};

class WorkoutController {
  /**
   * Get workout templates by category/muscle group
   */
  async getWorkoutTemplates(req, res) {
    try {
      const { category, muscleGroup, difficulty, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('workout_templates')
        .select(`
          id,
          name,
          description,
          category,
          difficulty_level,
          estimated_duration,
          calories_burned_estimate,
          muscle_groups,
          equipment_needed,
          image_url,
                      exercises:workout_template_exercises(
              id,
              exercise_id,
              sets,
              reps,
              duration_seconds,
              rest_seconds,
              order_index,
              exercises(id, name, muscle_groups)
            )
        `)
        .eq('is_active', true);

      // Filtres
      if (category) query = query.eq('category', category);
      if (muscleGroup) query = query.contains('muscle_groups', [muscleGroup]);
      if (difficulty) query = query.eq('difficulty_level', difficulty);

      // Pagination et tri
      query = query.range(offset, offset + limit - 1).order('name');

      const { data: templates, error } = await query;

      if (error) {
        logger.error('Get workout templates error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des programmes'
        });
      }

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: templates.length === parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get workout templates error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Create custom workout
   */
  async createWorkout(req, res) {
    try {
      const userId = req.user.id;
      const { name, description, exercises, scheduledDate, isTemplate = false } = req.body;

      // Créer l'entraînement
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name,
          description,
          scheduled_date: scheduledDate,
          is_template: isTemplate,
          status: 'planned',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (workoutError) {
        logger.error('Create workout error:', workoutError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création de l\'entraînement'
        });
      }

      // Ajouter les exercices
      if (exercises && exercises.length > 0) {
        const workoutExercises = exercises.map((exercise, index) => ({
          workout_id: workout.id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_kg: exercise.weight_kg,
          duration_seconds: exercise.duration_seconds,
          rest_seconds: exercise.rest_seconds,
          order_index: index,
          notes: exercise.notes
        }));

        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(workoutExercises);

        if (exercisesError) {
          logger.error('Create workout exercises error:', exercisesError);
          // Rollback workout creation
          await supabase.from('workouts').delete().eq('id', workout.id);
          return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'ajout des exercices'
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Entraînement créé avec succès',
        data: { workout }
      });

    } catch (error) {
      logger.error('Create workout error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Start workout session
   */
  async startWorkout(req, res) {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;

      // Vérifier que l'entraînement appartient à l'utilisateur
      const { data: workout, error: getError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .eq('user_id', userId)
        .single();

      if (getError || !workout) {
        return res.status(404).json({
          success: false,
          error: 'Entraînement non trouvé'
        });
      }

      if (workout.status === 'in_progress') {
        return res.status(409).json({
          success: false,
          error: 'Entraînement déjà en cours'
        });
      }

      // Mettre à jour le statut
      const { data: updatedWorkout, error: updateError } = await supabase
        .from('workouts')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', workoutId)
        .select(`
          *,
          exercises:workout_exercises(
            id,
            exercise_id,
            sets,
            reps,
            weight_kg,
            duration_seconds,
            rest_seconds,
            order_index,
            notes,
                         exercises(id, name, muscle_groups, equipment, instructions, gif_url)
          )
        `)
        .single();

      if (updateError) {
        logger.error('Start workout error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors du démarrage de l\'entraînement'
        });
      }

      res.json({
        success: true,
        message: 'Entraînement démarré',
        data: { workout: updatedWorkout }
      });

    } catch (error) {
      logger.error('Start workout error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Log exercise set
   */
  async logExerciseSet(req, res) {
    try {
      const userId = req.user.id;
      const { workoutExerciseId } = req.params;
      const { setNumber, reps, weight_kg, duration_seconds, notes } = req.body;

      // Vérifier que l'exercice appartient à l'utilisateur
      const { data: workoutExercise, error: getError } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          workouts!inner(user_id)
        `)
        .eq('id', workoutExerciseId)
        .eq('workouts.user_id', userId)
        .single();

      if (getError || !workoutExercise) {
        return res.status(404).json({
          success: false,
          error: 'Exercice non trouvé'
        });
      }

      // Enregistrer la série
      const { data: setLog, error: setError } = await supabase
        .from('exercise_sets')
        .insert({
          workout_exercise_id: workoutExerciseId,
          set_number: setNumber,
          reps_completed: reps,
          weight_kg,
          duration_seconds,
          notes,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (setError) {
        logger.error('Log exercise set error:', setError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de l\'enregistrement de la série'
        });
      }

      res.json({
        success: true,
        message: 'Série enregistrée',
        data: { setLog }
      });

    } catch (error) {
      logger.error('Log exercise set error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Complete workout
   */
  async completeWorkout(req, res) {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      const { notes, caloriesBurned, rating } = req.body;

      // Vérifier l'entraînement
      const { data: workout, error: getError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .single();

      if (getError || !workout) {
        return res.status(404).json({
          success: false,
          error: 'Entraînement en cours non trouvé'
        });
      }

      // Calculer la durée
      const endTime = new Date();
      const startTime = new Date(workout.started_at);
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

      // Marquer comme terminé
      const { data: completedWorkout, error: updateError } = await supabase
        .from('workouts')
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          duration_minutes: durationMinutes,
          calories_burned: caloriesBurned,
          notes,
          rating
        })
        .eq('id', workoutId)
        .select()
        .single();

      if (updateError) {
        logger.error('Complete workout error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la finalisation'
        });
      }

      // Mettre à jour les statistiques utilisateur
      await this.updateUserStats(userId);

      res.json({
        success: true,
        message: 'Entraînement terminé',
        data: {
          workout: completedWorkout,
          duration_minutes: durationMinutes
        }
      });

    } catch (error) {
      logger.error('Complete workout error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get user workout history
   */
  async getWorkoutHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('workouts')
        .select(`
          id,
          name,
          description,
          status,
          scheduled_date,
          started_at,
          completed_at,
          duration_minutes,
          calories_burned,
          rating,
          exercises:workout_exercises(
            id,
            sets,
            reps,
            exercises(name, muscle_group)
          )
        `)
        .eq('user_id', userId);

      // Filtres
      if (status) query = query.eq('status', status);
      if (startDate) query = query.gte('scheduled_date', startDate);
      if (endDate) query = query.lte('scheduled_date', endDate);

      // Pagination et tri
      query = query
        .range(offset, offset + limit - 1)
        .order('scheduled_date', { ascending: false });

      const { data: workouts, error } = await query;

      if (error) {
        logger.error('Get workout history error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération de l\'historique'
        });
      }

      res.json({
        success: true,
        data: {
          workouts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: workouts.length === parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get workout history error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get workout progress for specific exercise
   */
  async getExerciseProgress(req, res) {
    try {
      const userId = req.user.id;
      const { exerciseId } = req.params;
      const { period = '30' } = req.query; // days

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const { data: progress, error } = await supabase
        .from('exercise_sets')
        .select(`
          weight_kg,
          reps_completed,
          duration_seconds,
          completed_at,
          workout_exercises!inner(
            exercise_id,
            workouts!inner(user_id, completed_at)
          )
        `)
        .eq('workout_exercises.exercise_id', exerciseId)
        .eq('workout_exercises.workouts.user_id', userId)
        .gte('workout_exercises.workouts.completed_at', startDate.toISOString())
        .order('completed_at');

      if (error) {
        logger.error('Get exercise progress error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des progrès'
        });
      }

      // Calculer les métriques de progression
      const metrics = this.calculateProgressMetrics(progress);

      res.json({
        success: true,
        data: {
          progress,
          metrics,
          period_days: parseInt(period)
        }
      });

    } catch (error) {
      logger.error('Get exercise progress error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get AI workout recommendations
   */
  async getAIRecommendations(req, res) {
    try {
      const userId = req.user.id;

      // Récupérer le profil utilisateur et historique récent
      const { data: userProfile } = await supabase
        .from('users')
        .select('fitness_goals, fitness_level, preferences')
        .eq('id', userId)
        .single();

      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises:workout_exercises(
            exercises(muscle_group, category)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false });

      // Appeler le service AI (mock pour l'instant)
      const recommendations = await this.generateAIRecommendations(userProfile, recentWorkouts);

      res.json({
        success: true,
        data: { recommendations }
      });

    } catch (error) {
      logger.error('Get AI recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération des recommandations'
      });
    }
  }

  /**
   * Helper: Update user workout statistics
   */
  async updateUserStats(userId) {
    try {
      const { data: stats } = await supabase.rpc('update_user_workout_stats', {
        user_id: userId
      });
      return stats;
    } catch (error) {
      logger.error('Update user stats error:', error);
    }
  }

  /**
   * Helper: Calculate exercise progress metrics
   */
  calculateProgressMetrics(progressData) {
    if (!progressData || progressData.length === 0) {
      return {
        totalSets: 0,
        avgWeight: 0,
        maxWeight: 0,
        avgReps: 0,
        totalVolume: 0,
        improvement: 0
      };
    }

    const totalSets = progressData.length;
    const weights = progressData.map(p => p.weight_kg).filter(w => w);
    const reps = progressData.map(p => p.reps_completed).filter(r => r);

    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    const avgReps = reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : 0;

    // Volume total (poids × répétitions)
    const totalVolume = progressData.reduce((total, set) => {
      return total + (set.weight_kg || 0) * (set.reps_completed || 0);
    }, 0);

    // Calcul d'amélioration (comparaison première moitié vs deuxième moitié)
    const midPoint = Math.floor(progressData.length / 2);
    const firstHalf = progressData.slice(0, midPoint);
    const secondHalf = progressData.slice(midPoint);

    let improvement = 0;
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvgWeight = firstHalf.reduce((sum, set) => sum + (set.weight_kg || 0), 0) / firstHalf.length;
      const secondAvgWeight = secondHalf.reduce((sum, set) => sum + (set.weight_kg || 0), 0) / secondHalf.length;
      improvement = firstAvgWeight > 0 ? ((secondAvgWeight - firstAvgWeight) / firstAvgWeight) * 100 : 0;
    }

    return {
      totalSets,
      avgWeight: Math.round(avgWeight * 10) / 10,
      maxWeight,
      avgReps: Math.round(avgReps * 10) / 10,
      totalVolume,
      improvement: Math.round(improvement * 10) / 10
    };
  }

  /**
   * Helper: Generate AI workout recommendations (mock)
   */
  async generateAIRecommendations(userProfile, recentWorkouts) {
    // Mock AI recommendations - à remplacer par l'appel réel à l'API AI
    const recommendations = [
      {
        type: 'next_workout',
        title: 'Entraînement recommandé pour demain',
        description: 'Programme push basé sur vos objectifs',
        priority: 'high',
        workout_template_id: null,
        reasoning: 'Vous avez fait un pull hier, équilibrage avec push'
      },
      {
        type: 'rest_day',
        title: 'Jour de repos recommandé',
        description: 'Vos muscles ont besoin de récupération',
        priority: 'medium',
        reasoning: 'Intensité élevée ces 3 derniers jours'
      },
      {
        type: 'progressive_overload',
        title: 'Augmentez vos charges',
        description: 'Développé couché: +2.5kg recommandé',
        priority: 'medium',
        exercise_id: null,
        reasoning: 'Progression constante observée'
      }
    ];

    return recommendations;
  }
}

module.exports = new WorkoutController();