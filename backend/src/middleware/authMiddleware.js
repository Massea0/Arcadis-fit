const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../utils/logger');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Authentication middleware for protecting routes
 * Validates JWT tokens from Supabase Auth
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token attempt', {
        token: token.substring(0, 20) + '...',
        error: error?.message,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if user is active
    if (!user.email_confirmed_at) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Get additional user profile data from our database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Error fetching user profile', {
        userId: user.id,
        error: profileError.message
      });

      return res.status(500).json({
        success: false,
        message: 'Error fetching user profile',
        code: 'PROFILE_FETCH_ERROR'
      });
    }

    // Attach user data to request object
    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      ...userProfile
    };

    // Log successful authentication
    logger.info('User authenticated', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't require authentication
 * Useful for routes that can work with or without authentication
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalid token, continue without authentication
      req.user = null;
      return next();
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      ...userProfile
    };

    next();
  } catch (error) {
    // Error occurred, continue without authentication
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has required role
    // This can be extended based on your role system
    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole,
        allowedRoles,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Phone verification middleware
 * Ensures user has verified their phone number
 */
const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.phone_verified) {
    return res.status(403).json({
      success: false,
      message: 'Phone number verification required',
      code: 'PHONE_NOT_VERIFIED'
    });
  }

  next();
};

/**
 * Active membership middleware
 * Ensures user has an active gym membership
 */
const requireActiveMembership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check for active membership
    const { data: membership, error } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .single();

    if (error || !membership) {
      return res.status(403).json({
        success: false,
        message: 'Active membership required',
        code: 'NO_ACTIVE_MEMBERSHIP'
      });
    }

    req.membership = membership;
    next();
  } catch (error) {
    logger.error('Membership check error', {
      userId: req.user?.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Error checking membership status',
      code: 'MEMBERSHIP_CHECK_ERROR'
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requirePhoneVerification,
  requireActiveMembership
};