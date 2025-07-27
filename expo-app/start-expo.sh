#!/bin/bash

echo "🚀 === ARCADIS FIT EXPO - DÉMARRAGE RÉVOLUTIONNAIRE ==="
echo ""

# Vérifier si Expo CLI est installé
if ! command -v expo &> /dev/null; then
    echo "📦 Installation d'Expo CLI..."
    npm install -g expo-cli
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo ""
echo "🎊 ARCADIS FIT REVOLUTION EST PRÊTE !"
echo ""
echo "📱 Instructions pour tester sur votre téléphone:"
echo "1. Téléchargez 'Expo Go' depuis l'App Store (iOS) ou Google Play (Android)"
echo "2. Scannez le QR code qui va apparaître"
echo "3. Profitez de la révolution fitness ! 🌟"
echo ""
echo "🚀 Démarrage du serveur Expo..."
echo ""

# Démarrer Expo avec tunnel pour accès à distance
expo start --tunnel --clear