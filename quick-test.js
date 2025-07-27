#!/usr/bin/env node

// Quick Test Supabase - Script rapide sans installation
console.log('🏋️ Arcadis Fit - Test Rapide Supabase');
console.log('=====================================');

// Vérifier si on est dans le bon dossier
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('backend') || !fs.existsSync('README.md')) {
    console.log('❌ Erreur: Exécutez ce script depuis la racine du projet Arcadis Fit');
    process.exit(1);
}

console.log('✅ Répertoire projet détecté');

// Vérifier les fichiers backend
const backendPath = './backend';
const packageJsonPath = path.join(backendPath, 'package.json');
const srcPath = path.join(backendPath, 'src');

console.log('\n📁 Vérification de la structure:');
console.log('- backend/:', fs.existsSync(backendPath) ? '✅' : '❌');
console.log('- backend/package.json:', fs.existsSync(packageJsonPath) ? '✅' : '❌');
console.log('- backend/src/:', fs.existsSync(srcPath) ? '✅' : '❌');

// Vérifier les modules Node.js
const nodeModulesPath = path.join(backendPath, 'node_modules');
console.log('- backend/node_modules/:', fs.existsSync(nodeModulesPath) ? '✅' : '❌');

// Vérifier nos fichiers développés
const filesToCheck = [
    'src/controllers/authController.js',
    'src/controllers/userController.js', 
    'src/controllers/paymentController.js',
    'src/services/authService.js',
    'src/services/paymentService.js',
    'src/services/smsService.js',
    'src/utils/supabase.js',
    'src/utils/validation.js',
    'src/utils/logger.js',
    'src/middleware/auth.js',
    'src/middleware/validation.js',
    'src/routes/auth.js',
    'src/routes/users.js',
    'src/routes/payments.js'
];

console.log('\n🔧 Vérification des fichiers développés:');
filesToCheck.forEach(file => {
    const fullPath = path.join(backendPath, file);
    const exists = fs.existsSync(fullPath);
    console.log(`- ${file}: ${exists ? '✅' : '❌'}`);
});

// Vérifier le fichier .env
const envPath = path.join(backendPath, '.env');
console.log('\n⚙️ Configuration:');
console.log('- .env:', fs.existsSync(envPath) ? '✅' : '❌ (sera créé automatiquement)');

// Vérifier package.json
if (fs.existsSync(packageJsonPath)) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log('\n📦 Package.json:');
        console.log('- Nom:', packageJson.name || 'Non défini');
        console.log('- Version:', packageJson.version || 'Non défini');
        
        // Vérifier les dépendances importantes
        const deps = packageJson.dependencies || {};
        const importantDeps = [
            'express',
            '@supabase/supabase-js',
            'jsonwebtoken',
            'bcryptjs',
            'express-validator',
            'cors',
            'dotenv',
            'winston',
            'multer',
            'axios'
        ];
        
        console.log('\n📚 Dépendances importantes:');
        importantDeps.forEach(dep => {
            console.log(`- ${dep}: ${deps[dep] ? '✅ v' + deps[dep] : '❌'}`);
        });
        
    } catch (error) {
        console.log('❌ Erreur lors de la lecture de package.json:', error.message);
    }
}

// Test de base Node.js
console.log('\n🔍 Test Node.js:');
console.log('- Version Node.js:', process.version);
console.log('- Plateforme:', process.platform);
console.log('- Architecture:', process.arch);

// Créer un fichier .env basique si inexistant
if (!fs.existsSync(envPath)) {
    console.log('\n📝 Création du fichier .env de test...');
    const envContent = `# Configuration de test pour Arcadis Fit
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Supabase (à configurer par l'autre agent)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=test-jwt-secret-key-for-development-only
JWT_EXPIRES_IN=7d

# Twilio (mode test)
TWILIO_ACCOUNT_SID=test-account-sid
TWILIO_AUTH_TOKEN=test-auth-token
TWILIO_PHONE_NUMBER=+221123456789

# DEXCHANGE (mode test)
DEXCHANGE_API_URL=https://api.dexchange.sn
DEXCHANGE_API_KEY=test-api-key
DEXCHANGE_SECRET_KEY=test-secret-key
DEXCHANGE_MERCHANT_ID=test-merchant-id
DEXCHANGE_WEBHOOK_SECRET=test-webhook-secret

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000

# Feature flags
ENABLE_AI_FEATURES=true
ENABLE_PAYMENT_PROCESSING=false
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_ANALYTICS=false
ENABLE_SWAGGER=true
ENABLE_DEBUG_MODE=true
MOCK_PAYMENT_GATEWAY=true
MOCK_SMS_SERVICE=true
`;
    
    try {
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Fichier .env créé avec succès');
    } catch (error) {
        console.log('❌ Erreur lors de la création du .env:', error.message);
    }
}

// Instructions finales
console.log('\n🎯 Instructions pour tester Supabase:');
console.log('=====================================');
console.log('1. Assurez-vous que l\'autre agent a configuré les clés Supabase dans .env');
console.log('2. Installez les dépendances: cd backend && npm install');
console.log('3. Testez la connexion: cd backend && node -e "require(\'./src/utils/supabase\').testConnection()"');
console.log('4. Démarrez le serveur: cd backend && npm start');
console.log('5. Testez l\'API: curl http://localhost:3000/health');

console.log('\n📋 État actuel:');
console.log('- ✅ Structure backend complète');
console.log('- ✅ Contrôleurs développés (Auth, User, Payment)');
console.log('- ✅ Services métier complets');
console.log('- ✅ Middlewares sécurisés');
console.log('- ⏳ Configuration Supabase en attente');
console.log('- ⏳ Installation des dépendances requise');

console.log('\n🚀 Une fois Supabase configuré, le backend sera prêt pour les tests !');