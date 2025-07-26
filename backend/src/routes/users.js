const express = require('express');
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const { checkResourceOwnership, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Helper function pour gérer les erreurs async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/users/profile - Obtenir le profil de l'utilisateur connecté
router.get('/profile', asyncHandler(async (req, res) => {
  const result = await userService.getUserById(req.user.id);
  
  if (result.error) {
    return res.status(404).json({
      success: false,
      error: result.error.error,
      code: result.error.code
    });
  }

  res.json({
    success: true,
    data: result.data
  });
}));

// PUT /api/users/profile - Mettre à jour le profil
router.put('/profile', [
  body('first_name').optional().trim().isLength({ min: 2, max: 50 }),
  body('last_name').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone(),
  body('date_of_birth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('height').optional().isFloat({ min: 50, max: 300 }),
  body('weight').optional().isFloat({ min: 20, max: 500 }),
  body('fitness_level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('goals').optional().isArray(),
  body('bio').optional().isLength({ max: 500 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }

  const result = await userService.updateProfile(req.user.id, req.body);
  
  if (result.error) {
    return res.status(400).json({
      success: false,
      error: result.error.error,
      code: result.error.code
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
}));

// GET /api/users/stats - Statistiques de l'utilisateur
router.get('/stats', asyncHandler(async (req, res) => {
  const result = await userService.getUserStats(req.user.id);
  
  if (result.error) {
    return res.status(400).json({
      success: false,
      error: result.error.error,
      code: result.error.code
    });
  }

  res.json({
    success: true,
    data: result.data
  });
}));

// GET /api/users/search - Recherche d'utilisateurs (Admin seulement)
router.get('/search', authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 20, role } = req.query;
  
  const result = await userService.searchUsers(query, parseInt(page), parseInt(limit), role);
  
  if (result.error) {
    return res.status(400).json({
      success: false,
      error: result.error.error,
      code: result.error.code
    });
  }

  res.json({
    success: true,
    data: result.data
  });
}));

// PUT /api/users/:id/role - Mettre à jour le rôle d'un utilisateur (Admin seulement)
router.put('/:id/role', authorizeRoles('admin'), [
  body('role').isIn(['user', 'trainer', 'admin'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Rôle invalide',
      details: errors.array()
    });
  }

  const { id } = req.params;
  const { role } = req.body;
  
  const result = await userService.updateUserRole(id, role);
  
  if (result.error) {
    return res.status(400).json({
      success: false,
      error: result.error.error,
      code: result.error.code
    });
  }

  res.json({
    success: true,
    data: result.data,
    message: result.message
  });
}));

// DELETE /api/users/:id - Supprimer un utilisateur (Admin seulement)
router.delete('/:id', authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await userService.deleteUser(id);
  
  if (result.error) {
    return res.status(400).json({
      success: false,
      error: result.error.error,
      code: result.error.code
    });
  }

  res.json({
    success: true,
    message: result.message
  });
}));

module.exports = router;