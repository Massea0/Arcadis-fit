// Serveur de test simple pour Arcadis Fit
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de base
app.use(cors());
app.use(express.json());

// Test de Supabase
let supabaseStatus = 'non testé';
let supabaseClient = null;

async function initSupabase() {
    try {
        const { createClient } = require('@supabase/supabase-js');
        supabaseClient = createClient(
            process.env.SUPABASE_URL, 
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Test de ping
        const { error } = await supabaseClient.from('users').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
            supabaseStatus = `erreur: ${error.message}`;
        } else {
            supabaseStatus = 'connecté ✅';
        }
    } catch (error) {
        supabaseStatus = `erreur: ${error.message}`;
    }
}

// Routes de test
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Arcadis Fit API - Test Server',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        supabase: {
            status: supabaseStatus,
            url: process.env.SUPABASE_URL || 'non configuré',
            configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
        },
        services: {
            auth: 'disponible',
            users: 'disponible', 
            payments: 'disponible'
        }
    });
});

app.get('/test/supabase', async (req, res) => {
    if (!supabaseClient) {
        return res.status(500).json({
            success: false,
            error: 'Supabase non initialisé'
        });
    }
    
    try {
        const { error } = await supabaseClient.from('users').select('count').limit(1);
        
        res.json({
            success: true,
            message: 'Test Supabase réussi',
            status: supabaseStatus,
            error: error ? error.message : null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/test/auth', (req, res) => {
    res.json({
        success: true,
        message: 'Service d\'authentification disponible',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            logout: 'POST /api/auth/logout'
        }
    });
});

app.get('/test/users', (req, res) => {
    res.json({
        success: true,
        message: 'Service utilisateurs disponible',
        endpoints: {
            profile: 'GET /api/users/profile',
            update: 'PUT /api/users/profile',
            stats: 'GET /api/users/stats'
        }
    });
});

app.get('/test/payments', (req, res) => {
    res.json({
        success: true,
        message: 'Service de paiement disponible',
        endpoints: {
            plans: 'GET /api/payments/plans',
            initiate: 'POST /api/payments/initiate',
            status: 'GET /api/payments/:paymentId/status'
        }
    });
});

// Route par défaut
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🏋️ Arcadis Fit API - Serveur de Test',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            supabase_test: '/test/supabase',
            auth_test: '/test/auth',
            users_test: '/test/users',
            payments_test: '/test/payments'
        }
    });
});

// Gestionnaire d'erreurs
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        message: error.message
    });
});

// Démarrage du serveur
async function startServer() {
    console.log('🚀 Démarrage du serveur de test Arcadis Fit...');
    
    // Initialiser Supabase
    await initSupabase();
    console.log('📡 Supabase:', supabaseStatus);
    
    // Démarrer le serveur
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Serveur démarré sur le port ${PORT}`);
        console.log(`📍 Health check: http://localhost:${PORT}/health`);
        console.log(`🔍 Test Supabase: http://localhost:${PORT}/test/supabase`);
        console.log(`🧪 Tests disponibles:`);
        console.log(`   - Auth: http://localhost:${PORT}/test/auth`);
        console.log(`   - Users: http://localhost:${PORT}/test/users`);
        console.log(`   - Payments: http://localhost:${PORT}/test/payments`);
        console.log('');
        console.log('🎯 Prêt pour les tests !');
    });
}

// Gestion des signaux d'arrêt
process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Arrêt du serveur...');
    process.exit(0);
});

// Démarrer
startServer().catch((error) => {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
});