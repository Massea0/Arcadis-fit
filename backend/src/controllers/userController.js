const { supabase } = require('../utils/supabase');
const authService = require('../services/authService');
const { validateUserProfile } = require('../utils/validation');
// Logger simple pour éviter les imports circulaires
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};

class UserController {
  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Validate profile data
      const validation = validateUserProfile({
        ...req.user,
        ...updates
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Données de profil invalides',
          details: validation.errors
        });
      }

      // Update user profile
      const updatedUser = await authService.updateUserProfile(userId, updates);

      logger.info(`Profile updated for user: ${userId}`);

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.full_name,
            phoneNumber: updatedUser.phone_number,
            phoneVerified: updatedUser.phone_verified,
            profilePicture: updatedUser.profile_picture_url,
            dateOfBirth: updatedUser.date_of_birth,
            gender: updatedUser.gender,
            heightCm: updatedUser.height_cm,
            heightFt: updatedUser.height_ft,
            heightIn: updatedUser.height_in,
            weightKg: updatedUser.weight_kg,
            weightLbs: updatedUser.weight_lbs,
            fitnessLevel: updatedUser.fitness_level,
            fitnessGoals: updatedUser.fitness_goals,
            unitsPreference: updatedUser.units_preference,
            languagePreference: updatedUser.language_preference,
            location: {
              lat: updatedUser.location_lat,
              lng: updatedUser.location_lng
            },
            privacySettings: updatedUser.privacy_settings,
            profileComplete: authService.isProfileComplete(updatedUser),
            updatedAt: updatedUser.updated_at
          }
        }
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du profil'
      });
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(req, res) {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Image requise'
        });
      }

      // Upload to Supabase Storage
      const fileName = `${userId}/profile-${Date.now()}.${req.file.originalname.split('.').pop()}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) {
        logger.error('Profile picture upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors du téléchargement de l\'image'
        });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const profilePictureUrl = urlData.publicUrl;

      // Update user profile with new picture URL
      await authService.updateUserProfile(userId, {
        profile_picture_url: profilePictureUrl
      });

      logger.info(`Profile picture updated for user: ${userId}`);

      res.json({
        success: true,
        message: 'Photo de profil mise à jour avec succès',
        data: {
          profilePictureUrl
        }
      });

    } catch (error) {
      logger.error('Upload profile picture error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du téléchargement de l\'image'
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await authService.getUserStats(userId);

      res.json({
        success: true,
        data: {
          stats
        }
      });

    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(req, res) {
    try {
      const userId = req.user.id;
      const { privacySettings } = req.body;

      if (!privacySettings || typeof privacySettings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Paramètres de confidentialité invalides'
        });
      }

      // Validate privacy settings structure
      const allowedSettings = [
        'profile_public',
        'share_workouts',
        'share_nutrition',
        'share_progress',
        'allow_friend_requests',
        'show_in_leaderboard'
      ];

      const filteredSettings = {};
      for (const key of allowedSettings) {
        if (key in privacySettings && typeof privacySettings[key] === 'boolean') {
          filteredSettings[key] = privacySettings[key];
        }
      }

      // Update privacy settings
      const updatedUser = await authService.updateUserProfile(userId, {
        privacy_settings: {
          ...req.user.privacy_settings,
          ...filteredSettings
        }
      });

      logger.info(`Privacy settings updated for user: ${userId}`);

      res.json({
        success: true,
        message: 'Paramètres de confidentialité mis à jour',
        data: {
          privacySettings: updatedUser.privacy_settings
        }
      });

    } catch (error) {
      logger.error('Update privacy settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des paramètres'
      });
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password, confirmation } = req.body;

      if (!password || !confirmation) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe et confirmation requis'
        });
      }

      if (confirmation !== 'DELETE') {
        return res.status(400).json({
          success: false,
          error: 'Confirmation invalide. Tapez "DELETE" pour confirmer.'
        });
      }

      // Verify password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: req.user.email,
        password
      });

      if (authError) {
        return res.status(401).json({
          success: false,
          error: 'Mot de passe incorrect'
        });
      }

      // Soft delete user (mark as deleted instead of actually deleting)
      await authService.updateUserProfile(userId, {
        deleted_at: new Date().toISOString(),
        email: `deleted_${Date.now()}_${req.user.email}`,
        phone_number: null
      });

      // Delete from Supabase Auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) {
        logger.error('Supabase user deletion error:', deleteError);
        // Continue even if Supabase deletion fails
      }

      logger.warn(`User account deleted: ${userId}`);

      res.json({
        success: true,
        message: 'Compte supprimé avec succès'
      });

    } catch (error) {
      logger.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du compte'
      });
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(req, res) {
    try {
      const userId = req.user.id;

      const preferences = {
        language: req.user.language_preference || 'fr',
        units: req.user.units_preference || 'metric',
        notifications: {
          workoutReminders: true,
          nutritionReminders: true,
          progressUpdates: true,
          socialUpdates: false
        },
        privacy: req.user.privacy_settings || {
          profile_public: false,
          share_workouts: false,
          share_nutrition: false
        }
      };

      res.json({
        success: true,
        data: {
          preferences
        }
      });

    } catch (error) {
      logger.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des préférences'
      });
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(req, res) {
    try {
      const userId = req.user.id;
      const { language, units, notifications, privacy } = req.body;

      const updates = {};

      // Update language preference
      if (language && ['fr', 'en', 'wo'].includes(language)) {
        updates.language_preference = language;
      }

      // Update units preference
      if (units && ['metric', 'imperial'].includes(units)) {
        updates.units_preference = units;
      }

      // Update privacy settings
      if (privacy && typeof privacy === 'object') {
        updates.privacy_settings = {
          ...req.user.privacy_settings,
          ...privacy
        };
      }

      // Update user profile
      if (Object.keys(updates).length > 0) {
        await authService.updateUserProfile(userId, updates);
      }

      // Notification preferences would be stored separately in a notifications table
      // For now, we'll just acknowledge them
      
      logger.info(`Preferences updated for user: ${userId}`);

      res.json({
        success: true,
        message: 'Préférences mises à jour avec succès'
      });

    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des préférences'
      });
    }
  }

  /**
   * Get user activity feed
   */
  async getActivityFeed(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      // Get recent activities (workouts, nutrition logs, achievements, etc.)
      const { data: activities, error } = await supabase
        .from('user_activities')
        .select(`
          id,
          activity_type,
          activity_data,
          created_at,
          workout_logs(exercise_name, duration, calories_burned),
          nutrition_logs(food_name, calories),
          achievements(name, description, icon)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Get activity feed error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des activités'
        });
      }

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: activities.length === parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get activity feed error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des activités'
      });
    }
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(req, res) {
    try {
      const userId = req.user.id;

      // Collect all user data from various tables
      const [
        userProfile,
        workoutLogs,
        nutritionLogs,
        payments,
        memberships
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('workout_logs').select('*').eq('user_id', userId),
        supabase.from('nutrition_logs').select('*').eq('user_id', userId),
        supabase.from('payments').select('*').eq('user_id', userId),
        supabase.from('memberships').select('*').eq('user_id', userId)
      ]);

      const userData = {
        profile: userProfile.data,
        workouts: workoutLogs.data || [],
        nutrition: nutritionLogs.data || [],
        payments: payments.data || [],
        memberships: memberships.data || [],
        exportDate: new Date().toISOString()
      };

      logger.info(`Data export requested by user: ${userId}`);

      res.json({
        success: true,
        message: 'Données utilisateur exportées',
        data: userData
      });

    } catch (error) {
      logger.error('Export user data error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'exportation des données'
      });
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(req, res) {
    try {
      const userId = req.user.id;
      const {
        dateOfBirth,
        gender,
        heightCm,
        heightFt,
        heightIn,
        weightKg,
        weightLbs,
        fitnessLevel,
        fitnessGoals,
        locationLat,
        locationLng
      } = req.body;

      // Validate required onboarding fields
      if (!dateOfBirth || !gender || !fitnessLevel || !fitnessGoals) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants pour finaliser l\'inscription'
        });
      }

      // Validate height and weight (either metric or imperial)
      const hasHeight = heightCm || (heightFt && heightIn);
      const hasWeight = weightKg || weightLbs;

      if (!hasHeight || !hasWeight) {
        return res.status(400).json({
          success: false,
          error: 'Taille et poids requis'
        });
      }

      const updates = {
        date_of_birth: dateOfBirth,
        gender,
        fitness_level: fitnessLevel,
        fitness_goals: fitnessGoals,
        onboarding_completed: true
      };

      // Add height data
      if (heightCm) {
        updates.height_cm = heightCm;
      }
      if (heightFt && heightIn) {
        updates.height_ft = heightFt;
        updates.height_in = heightIn;
      }

      // Add weight data
      if (weightKg) {
        updates.weight_kg = weightKg;
      }
      if (weightLbs) {
        updates.weight_lbs = weightLbs;
      }

      // Add location if provided
      if (locationLat && locationLng) {
        updates.location_lat = locationLat;
        updates.location_lng = locationLng;
      }

      // Update user profile
      const updatedUser = await authService.updateUserProfile(userId, updates);

      logger.info(`Onboarding completed for user: ${userId}`);

      res.json({
        success: true,
        message: 'Inscription finalisée avec succès',
        data: {
          user: {
            id: updatedUser.id,
            profileComplete: authService.isProfileComplete(updatedUser),
            onboardingCompleted: updatedUser.onboarding_completed
          }
        }
      });

    } catch (error) {
      logger.error('Complete onboarding error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la finalisation de l\'inscription'
      });
    }
  }
}

module.exports = new UserController();