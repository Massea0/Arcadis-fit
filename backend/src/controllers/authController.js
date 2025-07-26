const { supabaseAdmin, supabaseClient } = require('../config/supabase');
const userService = require('../services/userService');
const { validationResult } = require('express-validator');

class AuthController {
  // Inscription d'un nouvel utilisateur
  async register(req, res) {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { email, password, first_name, last_name, phone, date_of_birth, gender } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser.success) {
        return res.status(409).json({
          success: false,
          error: 'Un compte avec cet email existe déjà',
          code: 'USER_ALREADY_EXISTS'
        });
      }

      // Créer l'utilisateur
      const result = await userService.createUser({
        email,
        password,
        first_name,
        last_name,
        phone,
        date_of_birth,
        gender
      });

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error.error,
          code: result.error.code
        });
      }

      // Connecter automatiquement l'utilisateur après inscription
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        return res.status(201).json({
          success: true,
          message: 'Compte créé avec succès. Veuillez vous connecter.',
          data: { user: result.data.user, profile: result.data.profile }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Compte créé et connecté avec succès',
        data: {
          user: signInData.user,
          profile: result.data.profile,
          session: signInData.session
        }
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Connexion utilisateur
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Connexion avec Supabase
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Récupérer le profil utilisateur
      const profileResult = await userService.getUserById(data.user.id);
      
      if (profileResult.error) {
        return res.status(404).json({
          success: false,
          error: 'Profil utilisateur non trouvé',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Mettre à jour la dernière connexion
      await supabaseAdmin
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: data.user,
          profile: profileResult.data,
          session: data.session
        }
      });
    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Déconnexion
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token manquant',
          code: 'MISSING_TOKEN'
        });
      }

      // Déconnexion avec Supabase
      const { error } = await supabaseAdmin.auth.admin.signOut(token);

      if (error) {
        console.error('Erreur déconnexion:', error);
      }

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Rafraîchir le token
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token manquant',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token invalide',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      res.json({
        success: true,
        message: 'Token rafraîchi avec succès',
        data: {
          session: data.session
        }
      });
    } catch (error) {
      console.error('Erreur refresh token:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Mot de passe oublié
  async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Email invalide',
          details: errors.array()
        });
      }

      const { email } = req.body;

      // Envoyer l'email de réinitialisation
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        console.error('Erreur reset password:', error);
        // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      }

      res.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      });
    } catch (error) {
      console.error('Erreur forgot password:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Réinitialiser le mot de passe
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { access_token, refresh_token, new_password } = req.body;

      // Établir la session avec les tokens
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
        access_token,
        refresh_token
      });

      if (sessionError) {
        return res.status(401).json({
          success: false,
          error: 'Tokens invalides',
          code: 'INVALID_TOKENS'
        });
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: new_password
      });

      if (updateError) {
        return res.status(400).json({
          success: false,
          error: 'Impossible de mettre à jour le mot de passe',
          code: 'UPDATE_PASSWORD_FAILED'
        });
      }

      res.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur reset password:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Changer le mot de passe (utilisateur connecté)
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { current_password, new_password } = req.body;
      const { email } = req.user;

      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password: current_password
      });

      if (signInError) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe actuel incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        req.user.id,
        { password: new_password }
      );

      if (updateError) {
        return res.status(400).json({
          success: false,
          error: 'Impossible de mettre à jour le mot de passe',
          code: 'UPDATE_PASSWORD_FAILED'
        });
      }

      res.json({
        success: true,
        message: 'Mot de passe changé avec succès'
      });
    } catch (error) {
      console.error('Erreur change password:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Vérifier le statut de l'utilisateur
  async getProfile(req, res) {
    try {
      const profileResult = await userService.getUserById(req.user.id);
      
      if (profileResult.error) {
        return res.status(404).json({
          success: false,
          error: 'Profil non trouvé',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          user: req.user,
          profile: profileResult.data
        }
      });
    } catch (error) {
      console.error('Erreur get profile:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = new AuthController();