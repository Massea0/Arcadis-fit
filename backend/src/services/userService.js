const { 
  supabaseAdmin, 
  TABLES, 
  handleSupabaseError,
  createUserWithProfile,
  uploadFile,
  STORAGE_BUCKETS 
} = require('../config/supabase');

class UserService {
  // Créer un nouvel utilisateur
  async createUser(userData) {
    try {
      const result = await createUserWithProfile(userData);
      
      if (result.error) {
        return { error: result.error };
      }

      return { 
        success: true, 
        data: result.data,
        message: 'Utilisateur créé avec succès'
      };
    } catch (error) {
      return { error: handleSupabaseError(error, 'création utilisateur') };
    }
  }

  // Obtenir un utilisateur par ID
  async getUserById(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from(TABLES.PROFILES)
        .select(`
          *,
          subscriptions!inner(
            id,
            plan_type,
            status,
            expires_at,
            created_at
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        return { error: handleSupabaseError(error, 'récupération utilisateur') };
      }

      return { success: true, data };
    } catch (error) {
      return { error: handleSupabaseError(error, 'getUserById') };
    }
  }

  // Obtenir un utilisateur par email
  async getUserByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from(TABLES.PROFILES)
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return { error: handleSupabaseError(error, 'récupération utilisateur par email') };
      }

      return { success: true, data };
    } catch (error) {
      return { error: handleSupabaseError(error, 'getUserByEmail') };
    }
  }

  // Mettre à jour un profil utilisateur
  async updateProfile(userId, updates) {
    try {
      // Retirer les champs non modifiables
      const allowedFields = [
        'first_name', 'last_name', 'phone', 'date_of_birth', 
        'gender', 'height', 'weight', 'fitness_level', 'goals',
        'preferences', 'bio', 'avatar_url'
      ];

      const sanitizedUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          sanitizedUpdates[key] = updates[key];
        }
      });

      sanitizedUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from(TABLES.PROFILES)
        .update(sanitizedUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { error: handleSupabaseError(error, 'mise à jour profil') };
      }

      return { 
        success: true, 
        data,
        message: 'Profil mis à jour avec succès'
      };
    } catch (error) {
      return { error: handleSupabaseError(error, 'updateProfile') };
    }
  }

  // Uploader une photo de profil
  async uploadProfileImage(userId, file) {
    try {
      const result = await uploadFile(
        file,
        STORAGE_BUCKETS.PROFILE_IMAGES,
        `profile_${userId}.jpg`,
        userId
      );

      if (result.error) {
        return { error: result.error };
      }

      // Mettre à jour l'URL de l'avatar dans le profil
      const updateResult = await this.updateProfile(userId, {
        avatar_url: result.data.url
      });

      if (updateResult.error) {
        return { error: updateResult.error };
      }

      return {
        success: true,
        data: {
          avatar_url: result.data.url,
          profile: updateResult.data
        },
        message: 'Photo de profil mise à jour avec succès'
      };
    } catch (error) {
      return { error: handleSupabaseError(error, 'uploadProfileImage') };
    }
  }

  // Obtenir les statistiques d'un utilisateur
  async getUserStats(userId) {
    try {
      // Récupérer les statistiques d'entraînement
      const { data: workoutStats, error: workoutError } = await supabaseAdmin
        .from(TABLES.WORKOUT_LOGS)
        .select('id, duration, calories_burned, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (workoutError) {
        return { error: handleSupabaseError(workoutError, 'récupération stats entraînement') };
      }

      // Récupérer les statistiques de nutrition
      const { data: nutritionStats, error: nutritionError } = await supabaseAdmin
        .from(TABLES.MEAL_LOGS)
        .select('id, calories, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (nutritionError) {
        return { error: handleSupabaseError(nutritionError, 'récupération stats nutrition') };
      }

      // Calculer les statistiques
      const stats = {
        workouts: {
          total: workoutStats.length,
          totalDuration: workoutStats.reduce((sum, w) => sum + (w.duration || 0), 0),
          totalCaloriesBurned: workoutStats.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
          averagePerWeek: Math.round(workoutStats.length / 4.3) // 30 jours / 7 jours
        },
        nutrition: {
          totalMeals: nutritionStats.length,
          totalCalories: nutritionStats.reduce((sum, m) => sum + (m.calories || 0), 0),
          averageCaloriesPerDay: Math.round(
            nutritionStats.reduce((sum, m) => sum + (m.calories || 0), 0) / 30
          )
        },
        period: '30_days'
      };

      return { success: true, data: stats };
    } catch (error) {
      return { error: handleSupabaseError(error, 'getUserStats') };
    }
  }

  // Rechercher des utilisateurs (pour les admins)
  async searchUsers(query, page = 1, limit = 20, role = null) {
    try {
      let queryBuilder = supabaseAdmin
        .from(TABLES.PROFILES)
        .select('id, email, first_name, last_name, role, created_at, last_login')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (query) {
        queryBuilder = queryBuilder.or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
        );
      }

      if (role) {
        queryBuilder = queryBuilder.eq('role', role);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      queryBuilder = queryBuilder.range(from, to);

      const { data, error, count } = await queryBuilder;

      if (error) {
        return { error: handleSupabaseError(error, 'recherche utilisateurs') };
      }

      return {
        success: true,
        data: {
          users: data,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      return { error: handleSupabaseError(error, 'searchUsers') };
    }
  }

  // Supprimer un utilisateur
  async deleteUser(userId) {
    try {
      // Supprimer l'utilisateur de l'auth Supabase
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        return { error: handleSupabaseError(authError, 'suppression utilisateur auth') };
      }

      // Le profil sera automatiquement supprimé grâce aux contraintes de clé étrangère

      return { 
        success: true, 
        message: 'Utilisateur supprimé avec succès'
      };
    } catch (error) {
      return { error: handleSupabaseError(error, 'deleteUser') };
    }
  }

  // Mettre à jour le rôle d'un utilisateur
  async updateUserRole(userId, newRole) {
    try {
      const allowedRoles = ['user', 'trainer', 'admin'];
      
      if (!allowedRoles.includes(newRole)) {
        return { 
          error: { 
            error: 'Rôle invalide', 
            code: 'INVALID_ROLE',
            allowedRoles 
          } 
        };
      }

      const { data, error } = await supabaseAdmin
        .from(TABLES.PROFILES)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { error: handleSupabaseError(error, 'mise à jour rôle utilisateur') };
      }

      return { 
        success: true, 
        data,
        message: 'Rôle utilisateur mis à jour avec succès'
      };
    } catch (error) {
      return { error: handleSupabaseError(error, 'updateUserRole') };
    }
  }
}

module.exports = new UserService();