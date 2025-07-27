// 🌟 ARCADIS FIT SAAS ROUTES - Révolution Fitness
const express = require('express');
const saasController = require('../controllers/saasController');
const {
  authenticateToken,
  requirePhoneVerification,
  requireAdmin
} = require('../middleware/auth');
const {
  validatePagination,
  validateUUIDParam
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// 🧠 ARCADIS BRAIN - Routes IA Révolutionnaires

/**
 * @route POST /api/saas/brain/predict-injury
 * @desc 🔮 Prédiction révolutionnaire des blessures
 * @access Private
 */
router.post('/brain/predict-injury',
  authenticateToken,
  requirePhoneVerification,
  [
    body('movement_data')
      .isObject()
      .withMessage('Données de mouvement requises'),
    body('device_data')
      .optional()
      .isObject()
      .withMessage('Données de device invalides')
  ],
  saasController.predictInjuryRisk
);

/**
 * @route POST /api/saas/brain/analyze-emotions
 * @desc 🎭 Analyse d'émotions par la voix
 * @access Private
 */
router.post('/brain/analyze-emotions',
  authenticateToken,
  requirePhoneVerification,
  [
    body('voice_data')
      .optional()
      .isObject()
      .withMessage('Données vocales invalides'),
    body('audio_url')
      .optional()
      .isURL()
      .withMessage('URL audio invalide')
  ],
  saasController.analyzeEmotionalState
);

/**
 * @route POST /api/saas/brain/activate-coach
 * @desc 🌍 Activation coach IA personnel 24/7
 * @access Private
 */
router.post('/brain/activate-coach',
  authenticateToken,
  requirePhoneVerification,
  [
    body('location')
      .isObject()
      .withMessage('Données de localisation requises'),
    body('location.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude invalide'),
    body('location.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude invalide'),
    body('environment_data')
      .optional()
      .isObject()
      .withMessage('Données d\'environnement invalides')
  ],
  saasController.activatePersonalAICoach
);

/**
 * @route POST /api/saas/brain/analyze-food
 * @desc 🍽️ Analyse révolutionnaire d'aliments locaux
 * @access Private
 */
router.post('/brain/analyze-food',
  authenticateToken,
  requirePhoneVerification,
  [
    body('food_image')
      .isString()
      .withMessage('Image d\'aliment requise'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Données de localisation invalides'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description trop longue (max 500 caractères)')
  ],
  saasController.analyzeLocalFood
);

/**
 * @route GET /api/saas/brain/gamification
 * @desc 🎮 Activation gamification révolutionnaire
 * @access Private
 */
router.get('/brain/gamification',
  authenticateToken,
  requirePhoneVerification,
  saasController.activateAdvancedGamification
);

/**
 * @route POST /api/saas/brain/health-monitoring
 * @desc 🏥 Monitoring santé révolutionnaire
 * @access Private
 */
router.post('/brain/health-monitoring',
  authenticateToken,
  requirePhoneVerification,
  [
    body('health_device_data')
      .optional()
      .isObject()
      .withMessage('Données de santé invalides'),
    body('wearable_data')
      .optional()
      .isObject()
      .withMessage('Données de wearables invalides')
  ],
  saasController.activateHealthMonitoring
);

// 💎 SAAS MANAGEMENT - Routes Multi-Tenant

/**
 * @route POST /api/saas/tenants
 * @desc 🏢 Création tenant révolutionnaire
 * @access Admin
 */
router.post('/tenants',
  authenticateToken,
  requireAdmin,
  [
    body('name')
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nom tenant requis (2-100 caractères)'),
    body('business_type')
      .isIn(['individual_gym', 'gym_chain', 'corporate_wellness', 'fitness_franchise', 'government_health', 'university_campus', 'hotel_spa', 'medical_center'])
      .withMessage('Type de business invalide'),
    body('branding')
      .optional()
      .isObject()
      .withMessage('Données de branding invalides'),
    body('contact_email')
      .isEmail()
      .withMessage('Email de contact invalide'),
    body('plan_type')
      .isIn(['BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'FRANCHISE'])
      .withMessage('Type de plan invalide')
  ],
  saasController.createRevolutionaryTenant
);

/**
 * @route POST /api/saas/tenants/:tenantId/white-label
 * @desc 🎨 Génération white-label révolutionnaire
 * @access Admin
 */
router.post('/tenants/:tenantId/white-label',
  authenticateToken,
  requireAdmin,
  validateUUIDParam('tenantId'),
  [
    body('brand_name')
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nom de marque requis (2-50 caractères)'),
    body('brand_colors')
      .optional()
      .isObject()
      .withMessage('Couleurs de marque invalides'),
    body('logo_requirements')
      .optional()
      .isObject()
      .withMessage('Exigences logo invalides'),
    body('target_audience')
      .optional()
      .isString()
      .withMessage('Audience cible invalide'),
    body('brand_personality')
      .optional()
      .isArray()
      .withMessage('Personnalité de marque invalide')
  ],
  saasController.generateRevolutionaryWhiteLabel
);

/**
 * @route GET /api/saas/tenants/:tenantId/analytics
 * @desc 📊 Analytics prédictives révolutionnaires
 * @access Tenant Admin
 */
router.get('/tenants/:tenantId/analytics',
  authenticateToken,
  validateUUIDParam('tenantId'),
  saasController.generatePredictiveBusinessAnalytics
);

/**
 * @route GET /api/saas/tenants/:tenantId/marketplace
 * @desc 🏪 Configuration marketplace révolutionnaire
 * @access Tenant Admin
 */
router.get('/tenants/:tenantId/marketplace',
  authenticateToken,
  validateUUIDParam('tenantId'),
  saasController.setupFitnessAppMarketplace
);

/**
 * @route POST /api/saas/tenants/:tenantId/iot
 * @desc 🌐 Configuration IoT révolutionnaire
 * @access Tenant Admin
 */
router.post('/tenants/:tenantId/iot',
  authenticateToken,
  validateUUIDParam('tenantId'),
  [
    body('equipment_types')
      .optional()
      .isArray()
      .withMessage('Types d\'équipements invalides'),
    body('integration_preferences')
      .optional()
      .isObject()
      .withMessage('Préférences d\'intégration invalides')
  ],
  saasController.setupRevolutionaryIoTIntegrations
);

/**
 * @route POST /api/saas/tenants/:tenantId/metaverse
 * @desc 🎮 Configuration metaverse révolutionnaire
 * @access Tenant Admin
 */
router.post('/tenants/:tenantId/metaverse',
  authenticateToken,
  validateUUIDParam('tenantId'),
  [
    body('virtual_worlds')
      .optional()
      .isArray()
      .withMessage('Mondes virtuels invalides'),
    body('ar_features')
      .optional()
      .isArray()
      .withMessage('Fonctionnalités AR invalides'),
    body('hardware_budget')
      .optional()
      .isNumeric()
      .withMessage('Budget matériel invalide')
  ],
  saasController.setupMetaverseFitnessExperience
);

// 🚀 ENDPOINTS RÉVOLUTIONNAIRES SPÉCIAUX

/**
 * @route GET /api/saas/revolution/features
 * @desc 🌟 Liste des fonctionnalités révolutionnaires
 * @access Public
 */
router.get('/revolution/features', saasController.getRevolutionaryFeatures);

/**
 * @route POST /api/saas/revolution/demo
 * @desc 🎬 Création démo révolutionnaire instantanée
 * @access Public
 */
router.post('/revolution/demo',
  [
    body('company_name')
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nom d\'entreprise requis (2-100 caractères)'),
    body('business_type')
      .isIn(['individual_gym', 'gym_chain', 'corporate_wellness', 'fitness_franchise', 'government_health', 'university_campus', 'hotel_spa', 'medical_center'])
      .withMessage('Type de business invalide'),
    body('email')
      .isEmail()
      .withMessage('Email invalide'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Numéro de téléphone invalide'),
    body('country')
      .optional()
      .isString()
      .withMessage('Pays invalide')
  ],
  saasController.createInstantDemo
);

/**
 * @route GET /api/saas/health
 * @desc 🚀 Health check révolutionnaire
 * @access Public
 */
router.get('/health', saasController.getRevolutionaryHealth);

// 🎯 ENDPOINTS DÉMONSTRATION LIVE

/**
 * @route GET /api/saas/demo/live-features
 * @desc 🎬 Démonstration live des fonctionnalités
 * @access Public
 */
router.get('/demo/live-features', (req, res) => {
  res.json({
    success: true,
    message: "🎬 DÉMONSTRATION LIVE ARCADIS FIT SAAS",
    live_demo: {
      ai_brain_simulation: {
        injury_prediction: "⚡ Analyse en temps réel activée",
        emotion_analysis: "🎭 Détection émotionnelle par voix",
        ai_coach: "🤖 Coach personnel IA géolocalisé",
        food_analysis: "📸 Reconnaissance d'aliments locaux"
      },
      saas_capabilities: {
        tenant_deployment: "🚀 Déploiement en 3 minutes",
        white_label_generation: "🎨 Branding automatique par IA",
        predictive_analytics: "📊 Prédictions business temps réel",
        iot_integrations: "🌐 Objets connectés intégrés"
      },
      metaverse_preview: {
        vr_workouts: "🏝️ Entraînements VR immersifs",
        ar_coaching: "👁️ Réalité augmentée en salle",
        virtual_worlds: "🌍 Mondes fitness virtuels",
        social_experiences: "👥 Expériences sociales metaverse"
      }
    },
    demo_credentials: {
      demo_url: "https://live-demo.arcadisfit.com",
      test_account: "demo@arcadisfit.com",
      password: "DemoRevolution2025!"
    },
    contact_sales: {
      email: "revolution@arcadisfit.com",
      phone: "+33 1 XX XX XX XX",
      calendar: "https://calendly.com/arcadisfit-revolution"
    }
  });
});

/**
 * @route GET /api/saas/revolution/pricing
 * @desc 💎 Tarification révolutionnaire détaillée
 * @access Public
 */
router.get('/revolution/pricing', (req, res) => {
  res.json({
    success: true,
    message: "💎 TARIFICATION RÉVOLUTIONNAIRE ARCADIS FIT",
    plans: {
      basic: {
        name: "Basic Gym",
        price_monthly: "299€",
        price_yearly: "2990€ (2 mois offerts)",
        max_members: 500,
        staff_accounts: 10,
        features: [
          "✅ Dashboard analytics de base",
          "✅ Apps mobiles iOS/Android",
          "✅ Paiements Wave/Orange Money",
          "✅ Check-ins QR code",
          "✅ Support standard",
          "❌ IA prédictive",
          "❌ White-label",
          "❌ IoT integrations"
        ],
        best_for: "Salles de sport individuelles"
      },
      professional: {
        name: "Professional Chain",
        price_monthly: "699€",
        price_yearly: "6990€ (2 mois offerts)",
        max_members: 2000,
        staff_accounts: 50,
        features: [
          "✅ Tout du plan Basic",
          "✅ Analytics avancées",
          "✅ Branding personnalisé",
          "✅ API access",
          "✅ Multi-locations (5 max)",
          "✅ IA injury prediction",
          "✅ Emotional analysis",
          "❌ White-label complet",
          "❌ Metaverse"
        ],
        best_for: "Chaînes de salles de sport"
      },
      enterprise: {
        name: "Enterprise White-Label",
        price_monthly: "1999€",
        price_yearly: "19990€ (2 mois offerts)",
        max_members: "Illimité",
        staff_accounts: "Illimité",
        features: [
          "✅ Tout des plans précédents",
          "✅ White-label complet",
          "✅ Apps mobiles personnalisées",
          "✅ IA coach personnel 24/7",
          "✅ Marketplace apps",
          "✅ IoT integrations",
          "✅ Analytics prédictives business",
          "✅ Support dédié",
          "✅ Metaverse basic"
        ],
        best_for: "Grandes entreprises, wellness corporate"
      },
      franchise: {
        name: "Franchise Revolution",
        price_monthly: "4999€",
        price_yearly: "49990€ (2 mois offerts)",
        max_members: "Illimité",
        staff_accounts: "Illimité",
        features: [
          "✅ Tout des plans précédents",
          "✅ Système de franchise automatisé",
          "✅ Revenue sharing intelligent",
          "✅ Territory protection",
          "✅ Metaverse complet VR/AR",
          "✅ IA révolutionnaire complète",
          "✅ Custom development",
          "✅ Dedicated account manager",
          "✅ 24/7 premium support"
        ],
        best_for: "Réseaux de franchise fitness"
      }
    },
    add_ons: {
      "AI Premium Pack": "499€/mois - IA révolutionnaire complète",
      "Metaverse Experience": "999€/mois - VR/AR fitness complet",
      "IoT Integration Pack": "299€/mois - Objets connectés avancés",
      "Custom Development": "Sur devis - Développement sur mesure"
    },
    guarantees: [
      "🎯 ROI garanti sous 90 jours",
      "🔒 99.9% uptime garanti",
      "💰 Remboursement 30 jours",
      "🚀 Migration gratuite",
      "📞 Support 24/7 inclus"
    ],
    contact_info: {
      sales_email: "sales@arcadisfit.com",
      demo_request: "https://arcadisfit.com/demo",
      phone_france: "+33 1 XX XX XX XX",
      phone_senegal: "+221 XX XXX XX XX"
    }
  });
});

module.exports = router;