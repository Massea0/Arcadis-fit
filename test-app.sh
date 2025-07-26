#!/bin/bash

# Arcadis Fit - Test Script
# Ce script vous aide à tester l'application depuis votre téléphone sur un agent cloud

echo "🏋️ Arcadis Fit - Script de Test"
echo "=================================="
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
        return 1
    fi
    
    # Vérifier npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm trouvé: $NPM_VERSION"
    else
        print_error "npm n'est pas installé"
        return 1
    fi
    
    # Vérifier Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python3 trouvé: $PYTHON_VERSION"
    else
        print_error "Python3 n'est pas installé"
        return 1
    fi
    
    # Vérifier Docker (optionnel)
    if command -v docker &> /dev/null; then
        print_success "Docker trouvé"
    else
        print_warning "Docker n'est pas installé (optionnel)"
    fi
    
    return 0
}

# Installer les dépendances du backend
install_backend_dependencies() {
    print_status "Installation des dépendances du backend..."
    
    if [ ! -d "backend" ]; then
        print_error "Le dossier backend n'existe pas"
        return 1
    fi
    
    cd backend
    
    if [ ! -f "package.json" ]; then
        print_error "package.json non trouvé dans le dossier backend"
        return 1
    fi
    
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dépendances du backend installées"
    else
        print_error "Erreur lors de l'installation des dépendances du backend"
        return 1
    fi
    
    cd ..
}

# Installer les dépendances des services AI
install_ai_dependencies() {
    print_status "Installation des dépendances des services AI..."
    
    if [ ! -d "ai-services" ]; then
        print_error "Le dossier ai-services n'existe pas"
        return 1
    fi
    
    cd ai-services
    
    # Nutrition AI
    if [ -d "nutrition-ai" ]; then
        cd nutrition-ai
        if [ ! -f "requirements.txt" ]; then
            print_warning "requirements.txt non trouvé, création d'un fichier de base..."
            cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
tensorflow==2.15.0
scikit-learn==1.3.2
pandas==2.1.4
numpy==1.24.3
python-dotenv==1.0.0
requests==2.31.0
joblib==1.3.2
EOF
        fi
        
        pip3 install -r requirements.txt
        if [ $? -eq 0 ]; then
            print_success "Dépendances du service Nutrition AI installées"
        else
            print_error "Erreur lors de l'installation des dépendances Nutrition AI"
        fi
        cd ..
    fi
    
    cd ..
}

# Démarrer le backend
start_backend() {
    print_status "Démarrage du backend..."
    
    cd backend
    
    # Vérifier si le fichier .env existe
    if [ ! -f ".env" ]; then
        print_warning "Fichier .env non trouvé, création d'un fichier de test..."
        cat > .env << EOF
# Configuration de test pour Arcadis Fit
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Supabase (à configurer)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=test-jwt-secret-key-for-development-only
JWT_EXPIRES_IN=7d

# Twilio (à configurer)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# DEXCHANGE (à configurer)
DEXCHANGE_API_URL=https://api.dexchange.com
DEXCHANGE_API_KEY=your-dexchange-api-key
DEXCHANGE_SECRET_KEY=your-dexchange-secret-key
DEXCHANGE_MERCHANT_ID=your-merchant-id

# AI Services
NUTRITION_AI_URL=http://localhost:8001
WORKOUT_AI_URL=http://localhost:8002

# Localisation
DEFAULT_LANGUAGE=fr
DEFAULT_CURRENCY=XOF
DEFAULT_COUNTRY=Senegal
DEFAULT_PHONE_CODE=+221

# Feature flags
ENABLE_AI_FEATURES=true
ENABLE_PAYMENT_PROCESSING=false
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_ANALYTICS=false
ENABLE_SWAGGER=true
ENABLE_DEBUG_MODE=true
MOCK_PAYMENT_GATEWAY=true
MOCK_SMS_SERVICE=true
EOF
    fi
    
    # Démarrer le serveur
    npm run dev &
    BACKEND_PID=$!
    
    # Attendre que le serveur démarre
    sleep 5
    
    # Vérifier si le serveur fonctionne
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Backend démarré avec succès sur http://localhost:3000"
        echo $BACKEND_PID > backend.pid
    else
        print_error "Erreur lors du démarrage du backend"
        kill $BACKEND_PID 2>/dev/null
        return 1
    fi
    
    cd ..
}

# Démarrer les services AI
start_ai_services() {
    print_status "Démarrage des services AI..."
    
    cd ai-services
    
    # Nutrition AI
    if [ -d "nutrition-ai" ]; then
        cd nutrition-ai
        python3 main.py &
        NUTRITION_AI_PID=$!
        sleep 3
        
        if curl -s http://localhost:8001/health > /dev/null; then
            print_success "Service Nutrition AI démarré sur http://localhost:8001"
            echo $NUTRITION_AI_PID > nutrition-ai.pid
        else
            print_error "Erreur lors du démarrage du service Nutrition AI"
        fi
        cd ..
    fi
    
    cd ..
}

# Afficher les informations de test
show_test_info() {
    echo ""
    echo "🎯 Informations de Test"
    echo "======================="
    echo ""
    
    # Obtenir l'IP publique
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Non disponible")
    
    echo "📱 Pour tester depuis votre téléphone :"
    echo ""
    echo "1. Backend API:"
    echo "   - Local: http://localhost:3000"
    echo "   - Public: http://$PUBLIC_IP:3000"
    echo "   - Health check: http://$PUBLIC_IP:3000/health"
    echo ""
    
    echo "2. Services AI:"
    echo "   - Nutrition AI: http://$PUBLIC_IP:8001"
    echo "   - Health check: http://$PUBLIC_IP:8001/health"
    echo ""
    
    echo "3. Documentation API:"
    echo "   - Swagger UI: http://$PUBLIC_IP:3000/api-docs"
    echo ""
    
    echo "🔧 Configuration requise :"
    echo ""
    echo "1. Ouvrez le port 3000 sur votre agent cloud :"
    echo "   - AWS: Ajoutez une règle de sécurité pour le port 3000"
    echo "   - Google Cloud: Créez une règle de pare-feu pour le port 3000"
    echo "   - Azure: Configurez le groupe de sécurité réseau"
    echo ""
    
    echo "2. Testez l'API depuis votre téléphone :"
    echo "   curl http://$PUBLIC_IP:3000/health"
    echo ""
    
    echo "3. Pour tester l'onboarding :"
    echo "   curl -X POST http://$PUBLIC_IP:3000/api/auth/register \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"email\":\"test@example.com\",\"password\":\"password123\",\"fullName\":\"Test User\",\"phoneNumber\":\"+221123456789\"}'"
    echo ""
}

# Fonction pour arrêter tous les services
stop_services() {
    print_status "Arrêt des services..."
    
    # Arrêter le backend
    if [ -f "backend/backend.pid" ]; then
        BACKEND_PID=$(cat backend/backend.pid)
        kill $BACKEND_PID 2>/dev/null
        rm backend/backend.pid
        print_success "Backend arrêté"
    fi
    
    # Arrêter les services AI
    if [ -f "ai-services/nutrition-ai/nutrition-ai.pid" ]; then
        NUTRITION_AI_PID=$(cat ai-services/nutrition-ai/nutrition-ai.pid)
        kill $NUTRITION_AI_PID 2>/dev/null
        rm ai-services/nutrition-ai/nutrition-ai.pid
        print_success "Service Nutrition AI arrêté"
    fi
    
    # Arrêter tous les processus Node.js
    pkill -f "node.*server.js" 2>/dev/null
    pkill -f "python.*main.py" 2>/dev/null
}

# Fonction pour nettoyer
cleanup() {
    print_status "Nettoyage..."
    stop_services
    print_success "Nettoyage terminé"
}

# Gestionnaire de signaux pour arrêter proprement
trap cleanup EXIT INT TERM

# Menu principal
show_menu() {
    echo ""
    echo "📋 Menu de Test"
    echo "==============="
    echo "1. Vérifier les prérequis"
    echo "2. Installer les dépendances"
    echo "3. Démarrer tous les services"
    echo "4. Afficher les informations de test"
    echo "5. Arrêter tous les services"
    echo "6. Test complet (1-4)"
    echo "0. Quitter"
    echo ""
    read -p "Choisissez une option (0-6): " choice
    echo ""
    
    case $choice in
        1)
            check_prerequisites
            ;;
        2)
            install_backend_dependencies
            install_ai_dependencies
            ;;
        3)
            start_backend
            start_ai_services
            ;;
        4)
            show_test_info
            ;;
        5)
            stop_services
            ;;
        6)
            check_prerequisites && \
            install_backend_dependencies && \
            install_ai_dependencies && \
            start_backend && \
            start_ai_services && \
            show_test_info
            ;;
        0)
            print_status "Au revoir !"
            exit 0
            ;;
        *)
            print_error "Option invalide"
            ;;
    esac
}

# Fonction principale
main() {
    echo "🏋️ Arcadis Fit - Script de Test"
    echo "=================================="
    echo ""
    echo "Ce script vous aide à tester l'application depuis votre téléphone"
    echo "sur un agent cloud."
    echo ""
    
    # Vérifier si on est dans le bon répertoire
    if [ ! -f "README.md" ] || [ ! -d "backend" ]; then
        print_error "Ce script doit être exécuté depuis la racine du projet Arcadis Fit"
        exit 1
    fi
    
    # Afficher le menu
    while true; do
        show_menu
        echo ""
        read -p "Appuyez sur Entrée pour continuer..."
    done
}

# Exécuter le script principal
main "$@"