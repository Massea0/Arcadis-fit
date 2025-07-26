const { supabaseAdmin } = require('../config/supabase');

// Middleware pour vérifier l'authentification
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'accès manquant',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token avec Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
        code: 'INVALID_TOKEN'
      });
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Profil utilisateur non trouvé',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = user;
    req.profile = profile;
    req.token = token;

    next();
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware pour vérifier les rôles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.profile) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.profile.role || 'user';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Permissions insuffisantes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_role: userRole
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur a un abonnement actif
const requireActiveSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Vérifier l'abonnement actif
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !subscription) {
      return res.status(403).json({
        success: false,
        error: 'Abonnement actif requis',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Erreur vérification abonnement:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware pour vérifier la propriété d'une ressource
const checkResourceOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'ID de ressource manquant',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      // Vérifier que la ressource appartient à l'utilisateur
      const { data: resource, error } = await supabaseAdmin
        .from(resourceModel)
        .select('user_id')
        .eq('id', resourceId)
        .single();

      if (error || !resource) {
        return res.status(404).json({
          success: false,
          error: 'Ressource non trouvée',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (resource.user_id !== req.user.id && req.profile.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé à cette ressource',
          code: 'UNAUTHORIZED_ACCESS'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification propriété:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// Middleware optionnel pour l'authentification (ne bloque pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token avec Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      // Récupérer le profil utilisateur
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        req.user = user;
        req.profile = profile;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    console.error('Erreur auth optionnelle:', error);
    next();
  }
};

module.exports = {
  authenticateUser,
  authorizeRoles,
  requireActiveSubscription,
  checkResourceOwnership,
  optionalAuth,
};