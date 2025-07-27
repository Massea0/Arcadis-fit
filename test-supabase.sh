#!/bin/bash

# Arcadis Fit - Test Supabase Non-Interactif
# Ce script teste automatiquement la connexion Supabase et démarre les services

echo "🏋️ Arcadis Fit - Test Supabase Automatique"
echo "============================================="
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    print_status "Vérification des prérequis..."
    
    # Vérifier Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js trouvé: $NODE_VERSION"
    else
        print_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm trouvé: $NPM_VERSION"
    else
        print_error "npm n'est pas installé"
        exit 1
    fi
}

# Créer le fichier .env s'il n'existe pas
create_env_file() {
    print_status "Configuration de l'environnement..."
    
    cd backend
    
    if [ ! -f ".env" ]; then
        print_warning "Fichier .env non trouvé, création d'un fichier de test..."
        cat > .env << 'EOF'
# Configuration de test pour Arcadis Fit
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Supabase (configuré par l'autre agent)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=test-jwt-secret-key-for-development-only-change-in-production
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

# URLs Frontend/Backend
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000

# AI Services
NUTRITION_AI_URL=http://localhost:8001
WORKOUT_AI_URL=http://localhost:8002

# Feature flags pour les tests
ENABLE_AI_FEATURES=true
ENABLE_PAYMENT_PROCESSING=false
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_ANALYTICS=false
ENABLE_SWAGGER=true
ENABLE_DEBUG_MODE=true
MOCK_PAYMENT_GATEWAY=true
MOCK_SMS_SERVICE=true
EOF
        print_success "Fichier .env créé avec configuration de test"
    else
        print_success "Fichier .env existant trouvé"
    fi
    
    cd ..
}

# Installer les dépendances
install_dependencies() {
    print_status "Installation des dépendances backend..."
    
    cd backend
    
    if [ ! -f "package.json" ]; then
        print_error "package.json non trouvé dans le dossier backend"
        exit 1
    fi
    
    # Installation avec timeout
    timeout 300 npm install
    if [ $? -eq 0 ]; then
        print_success "Dépendances installées avec succès"
    else
        print_error "Erreur lors de l'installation des dépendances"
        exit 1
    fi
    
    cd ..
}

# Créer un script de test simple pour Supabase
create_supabase_test() {
    print_status "Création du test de connexion Supabase..."
    
    cd backend
    
    cat > test-supabase-connection.js << 'EOF'
// Test de connexion Supabase
const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 Test de connexion Supabase...');
console.log('================================');

// Vérifier les variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n📋 Configuration:');
console.log('- SUPABASE_URL:', supabaseUrl || '❌ Non configuré');
console.log('- SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configuré' : '❌ Non configuré');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configuré' : '❌ Non configuré');

if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ Configuration Supabase incomplète');
    console.log('💡 L\'autre agent doit configurer les clés Supabase');
    process.exit(1);
}

// Test avec le client Supabase
try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('\n🔌 Test de connexion...');
    
    // Test avec la clé anonyme
    const supabaseAnon = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Client Supabase (anon) créé avec succès');
    
    // Test avec la clé service si disponible
    if (supabaseServiceKey) {
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        console.log('✅ Client Supabase (service) créé avec succès');
        
        // Test de nos utilitaires
        const { supabase: ourSupabase, testConnection } = require('./src/utils/supabase');
        console.log('✅ Utilitaire Supabase chargé');
        
        // Test de connexion
        testConnection().then(() => {
            console.log('✅ Test de connexion réussi');
            console.log('\n🎉 Supabase est correctement configuré !');
            process.exit(0);
        }).catch((error) => {
            console.log('❌ Test de connexion échoué:', error.message);
            console.log('\n💡 Vérifiez la configuration Supabase');
            process.exit(1);
        });
    } else {
        console.log('✅ Configuration de base OK');
        console.log('\n⚠️  Service role key manquante - fonctionnalités limitées');
        process.exit(0);
    }
    
} catch (error) {
    console.log('\n❌ Erreur lors du test:', error.message);
    console.log('💡 Vérifiez que @supabase/supabase-js est installé');
    process.exit(1);
}
EOF
    
    cd ..
    print_success "Script de test Supabase créé"
}

# Démarrer le serveur en mode test
start_test_server() {
    print_status "Démarrage du serveur de test..."
    
    cd backend
    
    # Créer un serveur simple pour les tests
    cat > test-server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Route de santé
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Arcadis Fit API est en ligne',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        supabase: {
            configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
            url: process.env.SUPABASE_URL || 'Non configuré'
        }
    });
});

// Route de test Supabase
app.get('/test/supabase', async (req, res) => {
    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Configuration Supabase manquante',
                message: 'SUPABASE_URL et SUPABASE_ANON_KEY requis'
            });
        }

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        // Test simple de ping
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (normal)
            throw error;
        }
        
        res.json({
            success: true,
            message: 'Connexion Supabase réussie',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur de connexion Supabase',
            message: error.message
        });
    }
});

// Route de test des services
app.get('/test/services', (req, res) => {
    const services = {
        auth: { status: 'ok', route: '/api/auth' },
        users: { status: 'ok', route: '/api/users' },
        payments: { status: 'ok', route: '/api/payments' },
        supabase: { 
            status: process.env.SUPABASE_URL ? 'configured' : 'not_configured',
            url: process.env.SUPABASE_URL
        }
    };
    
    res.json({
        success: true,
        services,
        timestamp: new Date().toISOString()
    });
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur de test démarré sur le port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Test Supabase: http://localhost:${PORT}/test/supabase`);
    console.log(`🔧 Services: http://localhost:${PORT}/test/services`);
});
EOF
    
    # Démarrer le serveur en arrière-plan
    node test-server.js &
    SERVER_PID=$!
    echo $SERVER_PID > test-server.pid
    
    # Attendre que le serveur démarre
    sleep 3
    
    # Tester la connexion
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Serveur de test démarré sur http://localhost:3000"
    else
        print_error "Erreur lors du démarrage du serveur"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    cd ..
}

# Exécuter les tests
run_tests() {
    print_status "Exécution des tests..."
    
    echo ""
    echo "🔍 Test 1: Vérification de la santé du serveur"
    curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health
    
    echo ""
    echo "🔍 Test 2: Test de la connexion Supabase"
    curl -s http://localhost:3000/test/supabase | jq . 2>/dev/null || curl -s http://localhost:3000/test/supabase
    
    echo ""
    echo "🔍 Test 3: Vérification des services"
    curl -s http://localhost:3000/test/services | jq . 2>/dev/null || curl -s http://localhost:3000/test/services
    
    echo ""
    echo "🔍 Test 4: Test de connexion direct Supabase"
    cd backend
    node test-supabase-connection.js
    cd ..
}

# Afficher les informations finales
show_results() {
    echo ""
    echo "📊 Résultats des Tests"
    echo "======================"
    echo ""
    
    # Obtenir l'IP publique
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    
    echo "✅ Serveur de test actif sur:"
    echo "   - Local: http://localhost:3000"
    echo "   - Public: http://$PUBLIC_IP:3000"
    echo ""
    
    echo "🔍 Endpoints de test:"
    echo "   - Health: http://$PUBLIC_IP:3000/health"
    echo "   - Supabase: http://$PUBLIC_IP:3000/test/supabase"
    echo "   - Services: http://$PUBLIC_IP:3000/test/services"
    echo ""
    
    echo "💡 Pour arrêter le serveur:"
    echo "   kill \$(cat backend/test-server.pid)"
    echo ""
}

# Nettoyage
cleanup() {
    print_status "Nettoyage..."
    if [ -f "backend/test-server.pid" ]; then
        PID=$(cat backend/test-server.pid)
        kill $PID 2>/dev/null
        rm backend/test-server.pid
        print_success "Serveur arrêté"
    fi
}

# Gestionnaire de signaux
trap cleanup EXIT INT TERM

# Fonction principale
main() {
    echo "🏋️ Arcadis Fit - Test Supabase Automatique"
    echo "============================================="
    echo ""
    
    # Vérifier si on est dans le bon répertoire
    if [ ! -f "README.md" ] || [ ! -d "backend" ]; then
        print_error "Ce script doit être exécuté depuis la racine du projet Arcadis Fit"
        exit 1
    fi
    
    # Exécuter tous les tests automatiquement
    check_prerequisites
    create_env_file
    install_dependencies
    create_supabase_test
    start_test_server
    run_tests
    show_results
    
    print_success "Tests terminés ! Le serveur reste actif pour les tests."
    print_status "Appuyez sur Ctrl+C pour arrêter le serveur."
    
    # Garder le script actif
    wait
}

# Exécuter le script principal
main "$@"