const { supabase } = require('../utils/supabase');
const smsService = require('../services/smsService');
const authService = require('../services/authService');
const { validateEmail, validatePhoneNumber } = require('../utils/validation');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Register new user with phone verification
   */
  async register(req, res) {
    try {
      const { email, password, fullName, phoneNumber } = req.body;

      // Validation
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Format d\'email invalide'
        });
      }

      if (!validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Numéro de téléphone invalide. Format requis: +221XXXXXXXXX'
        });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }

      // Check if user already exists
      const existingUser = await authService.findUserByEmailOrPhone(email, phoneNumber);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Un utilisateur avec cet email ou ce numéro existe déjà'
        });
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber
          }
        }
      });

      if (authError) {
        logger.error('Registration error:', authError);
        return res.status(400).json({
          success: false,
          error: 'Erreur lors de la création du compte'
        });
      }

      // Create user profile
      const userProfile = await authService.createUserProfile({
        id: authData.user.id,
        email,
        phoneNumber,
        fullName
      });

      // Send SMS verification code
      const verificationCode = await smsService.sendVerificationCode(phoneNumber);
      
      // Store verification code
      await authService.storeVerificationCode(authData.user.id, phoneNumber, verificationCode);

      logger.info(`User registered successfully: ${email}`);

      res.status(201).json({
        success: true,
        message: 'Compte créé avec succès. Code de vérification envoyé par SMS.',
        data: {
          userId: authData.user.id,
          email,
          phoneNumber,
          requiresVerification: true
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Verify phone number with SMS code
   */
  async verifyPhone(req, res) {
    try {
      const { userId, phoneNumber, code } = req.body;

      if (!userId || !phoneNumber || !code) {
        return res.status(400).json({
          success: false,
          error: 'Paramètres manquants'
        });
      }

      // Verify the code
      const isValidCode = await authService.verifyPhoneCode(userId, phoneNumber, code);
      
      if (!isValidCode) {
        return res.status(400).json({
          success: false,
          error: 'Code de vérification invalide ou expiré'
        });
      }

      // Update user profile
      await authService.markPhoneAsVerified(userId);

      logger.info(`Phone verified for user: ${userId}`);

      res.json({
        success: true,
        message: 'Numéro de téléphone vérifié avec succès'
      });

    } catch (error) {
      logger.error('Phone verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification'
      });
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(req, res) {
    try {
      const { userId, phoneNumber } = req.body;

      if (!userId || !phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Paramètres manquants'
        });
      }

      // Check rate limiting (max 3 codes per hour)
      const canResend = await authService.checkResendLimit(userId);
      if (!canResend) {
        return res.status(429).json({
          success: false,
          error: 'Limite de renvoi atteinte. Attendez 1 heure.'
        });
      }

      // Send new verification code
      const verificationCode = await smsService.sendVerificationCode(phoneNumber);
      
      // Store new verification code
      await authService.storeVerificationCode(userId, phoneNumber, verificationCode);

      res.json({
        success: true,
        message: 'Nouveau code de vérification envoyé'
      });

    } catch (error) {
      logger.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du renvoi du code'
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email et mot de passe requis'
        });
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        logger.warn(`Login failed for ${email}: ${authError.message}`);
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect'
        });
      }

      // Get user profile
      const userProfile = await authService.getUserProfile(authData.user.id);

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'Profil utilisateur non trouvé'
        });
      }

      // Check if phone is verified
      if (!userProfile.phone_verified) {
        return res.status(403).json({
          success: false,
          error: 'Numéro de téléphone non vérifié',
          requiresVerification: true,
          phoneNumber: userProfile.phone_number
        });
      }

      // Update last login
      await authService.updateLastLogin(authData.user.id);

      logger.info(`User logged in successfully: ${email}`);

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            id: userProfile.id,
            email: userProfile.email,
            fullName: userProfile.full_name,
            phoneNumber: userProfile.phone_number,
            phoneVerified: userProfile.phone_verified,
            profileComplete: authService.isProfileComplete(userProfile)
          },
          session: {
            accessToken: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
            expiresAt: authData.session.expires_at
          }
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Logout error:', error);
        return res.status(400).json({
          success: false,
          error: 'Erreur lors de la déconnexion'
        });
      }

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Adresse email valide requise'
        });
      }

      // Check if user exists
      const userExists = await authService.checkUserExists(email);
      if (!userExists) {
        // Don't reveal if user exists for security
        return res.json({
          success: true,
          message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
        });
      }

      // Send reset password email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        logger.error('Password reset error:', error);
        return res.status(400).json({
          success: false,
          error: 'Erreur lors de l\'envoi de l\'email'
        });
      }

      logger.info(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        message: 'Email de réinitialisation envoyé'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res) {
    try {
      const { password, accessToken } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }

      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Token de réinitialisation requis'
        });
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        logger.error('Password update error:', error);
        return res.status(400).json({
          success: false,
          error: 'Erreur lors de la réinitialisation du mot de passe'
        });
      }

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token requis'
        });
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        logger.error('Token refresh error:', error);
        return res.status(401).json({
          success: false,
          error: 'Token de rafraîchissement invalide'
        });
      }

      res.json({
        success: true,
        data: {
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at
          }
        }
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;

      const userProfile = await authService.getUserProfile(userId);

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'Profil utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: userProfile.id,
            email: userProfile.email,
            fullName: userProfile.full_name,
            phoneNumber: userProfile.phone_number,
            phoneVerified: userProfile.phone_verified,
            profilePicture: userProfile.profile_picture_url,
            dateOfBirth: userProfile.date_of_birth,
            gender: userProfile.gender,
            heightCm: userProfile.height_cm,
            heightFt: userProfile.height_ft,
            heightIn: userProfile.height_in,
            weightKg: userProfile.weight_kg,
            weightLbs: userProfile.weight_lbs,
            fitnessLevel: userProfile.fitness_level,
            fitnessGoals: userProfile.fitness_goals,
            unitsPreference: userProfile.units_preference,
            languagePreference: userProfile.language_preference,
            location: {
              lat: userProfile.location_lat,
              lng: userProfile.location_lng
            },
            privacySettings: userProfile.privacy_settings,
            profileComplete: authService.isProfileComplete(userProfile),
            createdAt: userProfile.created_at,
            updatedAt: userProfile.updated_at
          }
        }
      });

    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new AuthController();