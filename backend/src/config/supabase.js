const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes. Vérifiez votre fichier .env');
}

// Client avec clé de service pour les opérations administratives
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client avec clé anonyme pour les opérations utilisateur standard
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Configuration des buckets de stockage
const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  WORKOUT_IMAGES: 'workout-images',
  NUTRITION_IMAGES: 'nutrition-images',
  DOCUMENTS: 'documents',
  GENERAL: process.env.STORAGE_BUCKET || 'arcadis-fit-uploads',
};

// Configuration des tables principales
const TABLES = {
  USERS: 'users',
  PROFILES: 'profiles',
  MEMBERSHIPS: 'memberships',
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  WORKOUT_LOGS: 'workout_logs',
  NUTRITION_PLANS: 'nutrition_plans',
  MEAL_LOGS: 'meal_logs',
  FOODS: 'foods',
  PAYMENTS: 'payments',
  SUBSCRIPTIONS: 'subscriptions',
  NOTIFICATIONS: 'notifications',
  GYM_LOCATIONS: 'gym_locations',
  TRAINERS: 'trainers',
  CLASSES: 'classes',
  BOOKINGS: 'bookings',
};

// Fonction helper pour gérer les erreurs Supabase
const handleSupabaseError = (error, operation = 'Operation') => {
  console.error(`Erreur Supabase lors de ${operation}:`, error);
  
  if (error.code === 'PGRST116') {
    return { error: 'Aucun résultat trouvé', code: 'NOT_FOUND' };
  }
  
  if (error.code === '23505') {
    return { error: 'Cette entrée existe déjà', code: 'DUPLICATE_ENTRY' };
  }
  
  if (error.code === '23503') {
    return { error: 'Référence invalide', code: 'INVALID_REFERENCE' };
  }
  
  return { 
    error: error.message || 'Erreur interne du serveur', 
    code: error.code || 'INTERNAL_ERROR' 
  };
};

// Fonction pour vérifier la connexion à Supabase
const testConnection = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Erreur de connexion Supabase:', error);
      return false;
    }
    
    console.log('✅ Connexion Supabase établie avec succès');
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à Supabase:', error);
    return false;
  }
};

// Fonction pour créer un utilisateur avec profil
const createUserWithProfile = async (userData) => {
  try {
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
      },
    });

    if (authError) {
      return { error: handleSupabaseError(authError, 'création utilisateur auth') };
    }

    // Créer le profil utilisateur
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        date_of_birth: userData.date_of_birth,
        gender: userData.gender,
        fitness_level: userData.fitness_level || 'beginner',
        goals: userData.goals || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      // Supprimer l'utilisateur auth si la création du profil échoue
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { error: handleSupabaseError(profileError, 'création profil') };
    }

    return { data: { user: authData.user, profile: profileData } };
  } catch (error) {
    return { error: handleSupabaseError(error, 'createUserWithProfile') };
  }
};

// Fonction pour uploader un fichier
const uploadFile = async (file, bucket, fileName, userId) => {
  try {
    const filePath = `${userId}/${Date.now()}-${fileName}`;
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { error: handleSupabaseError(error, 'upload fichier') };
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { 
      data: { 
        path: filePath, 
        url: urlData.publicUrl,
        fullPath: data.path 
      } 
    };
  } catch (error) {
    return { error: handleSupabaseError(error, 'uploadFile') };
  }
};

// Fonction pour supprimer un fichier
const deleteFile = async (bucket, filePath) => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return { error: handleSupabaseError(error, 'suppression fichier') };
    }

    return { success: true };
  } catch (error) {
    return { error: handleSupabaseError(error, 'deleteFile') };
  }
};

// Fonction pour gérer les RLS (Row Level Security)
const setUserContext = async (userId) => {
  try {
    const { error } = await supabaseAdmin.rpc('set_user_context', {
      user_id: userId,
    });

    if (error) {
      return { error: handleSupabaseError(error, 'configuration contexte utilisateur') };
    }

    return { success: true };
  } catch (error) {
    return { error: handleSupabaseError(error, 'setUserContext') };
  }
};

module.exports = {
  supabaseAdmin,
  supabaseClient,
  STORAGE_BUCKETS,
  TABLES,
  handleSupabaseError,
  testConnection,
  createUserWithProfile,
  uploadFile,
  deleteFile,
  setUserContext,
};