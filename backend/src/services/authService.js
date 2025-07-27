const { supabase } = require('../utils/supabase');
const crypto = require('crypto');
const moment = require('moment');
// Logger simple pour éviter les imports circulaires
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};

class AuthService {
  /**
   * Find user by email or phone number
   */
  async findUserByEmailOrPhone(email, phoneNumber) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, phone_number')
        .or(`email.eq.${email},phone_number.eq.${phoneNumber}`)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error finding user:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('findUserByEmailOrPhone error:', error);
      return null;
    }
  }

  /**
   * Create user profile in the users table
   */
  async createUserProfile({ id, email, phoneNumber, fullName }) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id,
          email,
          phone_number: phoneNumber,
          full_name: fullName,
          phone_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating user profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('createUserProfile error:', error);
      throw error;
    }
  }

  /**
   * Store verification code for phone verification
   */
  async storeVerificationCode(userId, phoneNumber, code) {
    try {
      // Expire old codes for this user
      await supabase
        .from('user_verification_codes')
        .update({ used: true })
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber);

      // Store new verification code
      const expiresAt = moment().add(10, 'minutes').toISOString();
      
      const { data, error } = await supabase
        .from('user_verification_codes')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          code,
          expires_at: expiresAt,
          used: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error storing verification code:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('storeVerificationCode error:', error);
      throw error;
    }
  }

  /**
   * Verify phone verification code
   */
  async verifyPhoneCode(userId, phoneNumber, code) {
    try {
      const { data, error } = await supabase
        .from('user_verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .eq('code', code)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return false;
      }

      // Mark code as used
      await supabase
        .from('user_verification_codes')
        .update({ used: true })
        .eq('id', data.id);

      return true;
    } catch (error) {
      logger.error('verifyPhoneCode error:', error);
      return false;
    }
  }

  /**
   * Mark phone as verified
   */
  async markPhoneAsVerified(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error marking phone as verified:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('markPhoneAsVerified error:', error);
      throw error;
    }
  }

  /**
   * Check resend limit for verification codes
   */
  async checkResendLimit(userId) {
    try {
      const oneHourAgo = moment().subtract(1, 'hour').toISOString();

      const { data, error } = await supabase
        .from('user_verification_codes')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo);

      if (error) {
        logger.error('Error checking resend limit:', error);
        return false;
      }

      // Allow max 3 codes per hour
      return data.length < 3;
    } catch (error) {
      logger.error('checkResendLimit error:', error);
      return false;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error getting user profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('getUserProfile error:', error);
      throw error;
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        logger.error('Error updating last login:', error);
        // Don't throw error as this is not critical
      }
    } catch (error) {
      logger.error('updateLastLogin error:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Check if user exists by email
   */
  async checkUserExists(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error checking user exists:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('checkUserExists error:', error);
      return false;
    }
  }

  /**
   * Check if user profile is complete
   */
  isProfileComplete(userProfile) {
    if (!userProfile) return false;

    const requiredFields = [
      'full_name',
      'phone_number',
      'phone_verified',
      'date_of_birth',
      'gender',
      'fitness_level'
    ];

    // Check if height and weight are provided (either metric or imperial)
    const hasHeight = userProfile.height_cm || (userProfile.height_ft && userProfile.height_in);
    const hasWeight = userProfile.weight_kg || userProfile.weight_lbs;

    const hasRequiredFields = requiredFields.every(field => {
      const value = userProfile[field];
      return value !== null && value !== undefined && value !== '';
    });

    return hasRequiredFields && hasHeight && hasWeight && userProfile.phone_verified;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      // Add timestamp
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('updateUserProfile error:', error);
      throw error;
    }
  }

  /**
   * Generate secure verification code
   */
  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Generate secure reset token
   */
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash password (for additional security if needed)
   */
  hashPassword(password) {
    const bcrypt = require('bcryptjs');
    return bcrypt.hashSync(password, 12);
  }

  /**
   * Verify password hash
   */
  verifyPassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compareSync(password, hash);
  }

  /**
   * Clean up expired verification codes
   */
  async cleanupExpiredCodes() {
    try {
      const { error } = await supabase
        .from('user_verification_codes')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Error cleaning up expired codes:', error);
      }
    } catch (error) {
      logger.error('cleanupExpiredCodes error:', error);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      // Get user's workout count, nutrition logs, etc.
      const [workoutCount, nutritionCount, membershipStatus] = await Promise.all([
        this.getUserWorkoutCount(userId),
        this.getUserNutritionCount(userId),
        this.getUserMembershipStatus(userId)
      ]);

      return {
        totalWorkouts: workoutCount,
        totalNutritionLogs: nutritionCount,
        membershipStatus,
        joinedDate: await this.getUserJoinDate(userId)
      };
    } catch (error) {
      logger.error('getUserStats error:', error);
      return {
        totalWorkouts: 0,
        totalNutritionLogs: 0,
        membershipStatus: 'inactive',
        joinedDate: null
      };
    }
  }

  /**
   * Get user workout count
   */
  async getUserWorkoutCount(userId) {
    try {
      const { count, error } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        logger.error('Error getting workout count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('getUserWorkoutCount error:', error);
      return 0;
    }
  }

  /**
   * Get user nutrition count
   */
  async getUserNutritionCount(userId) {
    try {
      const { count, error } = await supabase
        .from('nutrition_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        logger.error('Error getting nutrition count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('getUserNutritionCount error:', error);
      return 0;
    }
  }

  /**
   * Get user membership status
   */
  async getUserMembershipStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error getting membership status:', error);
        return 'inactive';
      }

      return data ? 'active' : 'inactive';
    } catch (error) {
      logger.error('getUserMembershipStatus error:', error);
      return 'inactive';
    }
  }

  /**
   * Get user join date
   */
  async getUserJoinDate(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error getting join date:', error);
        return null;
      }

      return data.created_at;
    } catch (error) {
      logger.error('getUserJoinDate error:', error);
      return null;
    }
  }
}

module.exports = new AuthService();