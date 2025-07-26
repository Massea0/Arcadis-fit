const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'accès requis'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      logger.warn('Invalid JWT token', { 
        error: jwtError.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).json({
        success: false,
        error: 'Token invalide'
      });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      logger.warn('User not found for token', { 
        userId: decoded.userId,
        error: userError?.message 
      });
      
      return res.status(403).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

/**
 * Middleware to check if user's phone is verified
 */
const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  if (!req.user.phone_verified) {
    return res.status(403).json({
      success: false,
      error: 'Numéro de téléphone non vérifié',
      requiresVerification: true,
      phoneNumber: req.user.phone_number
    });
  }

  next();
};

/**
 * Middleware to check if user has completed onboarding
 */
const requireOnboardingComplete = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  // Check if required onboarding fields are complete
  const requiredFields = [
    'full_name',
    'date_of_birth',
    'gender',
    'fitness_level'
  ];

  const missingFields = requiredFields.filter(field => 
    !req.user[field] || req.user[field] === ''
  );

  // Check if height and weight are provided (either metric or imperial)
  const hasHeight = req.user.height_cm || (req.user.height_ft && req.user.height_in);
  const hasWeight = req.user.weight_kg || req.user.weight_lbs;

  if (missingFields.length > 0 || !hasHeight || !hasWeight) {
    return res.status(403).json({
      success: false,
      error: 'Profil incomplet',
      requiresOnboarding: true,
      missingFields: [
        ...missingFields,
        ...(hasHeight ? [] : ['height']),
        ...(hasWeight ? [] : ['weight'])
      ]
    });
  }

  next();
};

/**
 * Middleware to check if user has active membership
 */
const requireActiveMembership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    // Check for active membership
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error checking membership:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification de l\'abonnement'
      });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Abonnement actif requis',
        requiresMembership: true
      });
    }

    // Attach membership to request
    req.membership = membership;
    next();
  } catch (error) {
    logger.error('Membership check error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

/**
 * Middleware to check user role/permissions
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      logger.logSecurity('unauthorized_access_attempt', req.user.id, req.ip, {
        requiredRoles: roles,
        userRole,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

/**
 * Middleware for admin-only routes
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Middleware for gym manager routes
 */
const requireGymManager = requireRole(['gym_manager', 'admin', 'super_admin']);

/**
 * Middleware to check if user owns the resource
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'user_id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise'
        });
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'ID de ressource manquant'
        });
      }

      // For direct user ID comparison
      if (resourceIdParam === 'userId' || resourceIdParam === 'id') {
        if (resourceId !== req.user.id) {
          logger.logSecurity('ownership_violation', req.user.id, req.ip, {
            requestedResource: resourceId,
            endpoint: req.originalUrl
          });

          return res.status(403).json({
            success: false,
            error: 'Accès non autorisé à cette ressource'
          });
        }
        return next();
      }

      // For other resources, check ownership via database
      // This would need to be customized based on the specific resource
      req.resourceId = resourceId;
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  };
};

/**
 * Middleware to extract and validate Supabase session
 */
const extractSupabaseSession = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next();
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next();
    }

    req.supabaseUser = user;
    next();
  } catch (error) {
    logger.error('Supabase session extraction error:', error);
    next(); // Continue without session
  }
};

/**
 * Middleware to log authentication events
 */
const logAuthEvent = (event) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the auth event after response is sent
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      
      logger.logAuth(
        event,
        req.user?.id,
        req.user?.email || req.body?.email,
        req.ip,
        responseData?.success || res.statusCode < 400,
        responseData?.error
      );
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to check rate limiting for specific users
 */
const checkUserRateLimit = (maxRequests = 100, windowMs = 60 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user.id;
    const now = Date.now();
    const userKey = `${userId}_${Math.floor(now / windowMs)}`;
    
    const requests = userRequests.get(userKey) || 0;
    
    if (requests >= maxRequests) {
      logger.logSecurity('rate_limit_exceeded', userId, req.ip, {
        requests,
        maxRequests,
        endpoint: req.originalUrl
      });
      
      return res.status(429).json({
        success: false,
        error: 'Trop de requêtes. Veuillez patienter.'
      });
    }
    
    userRequests.set(userKey, requests + 1);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      const cutoff = Math.floor((now - windowMs) / windowMs);
      for (const [key] of userRequests) {
        const keyTime = parseInt(key.split('_')[1]);
        if (keyTime < cutoff) {
          userRequests.delete(key);
        }
      }
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requirePhoneVerification,
  requireOnboardingComplete,
  requireActiveMembership,
  requireRole,
  requireAdmin,
  requireGymManager,
  requireOwnership,
  extractSupabaseSession,
  logAuthEvent,
  checkUserRateLimit
};