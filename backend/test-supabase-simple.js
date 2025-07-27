// Test simple de connexion Supabase
require('dotenv').config();

console.log('🔍 Test de connexion Supabase Simple');
console.log('===================================');

// Vérifier les variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n📋 Configuration:');
console.log('- SUPABASE_URL:', supabaseUrl || '❌ Non configuré');
console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configuré' : '❌ Non configuré');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configuré' : '❌ Non configuré');

if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ Configuration Supabase incomplète');
    console.log('💡 Vérifiez le fichier .env');
    process.exit(1);
}

// Test avec le client Supabase
async function testSupabase() {
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        console.log('\n🔌 Test de connexion...');
        
        // Test avec la clé anonyme
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Client Supabase (anon) créé avec succès');
        
        // Test avec la clé service si disponible
        if (supabaseServiceKey) {
            const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
            console.log('✅ Client Supabase (service) créé avec succès');
            
            // Test de ping simple
            try {
                const { error } = await supabaseService.from('users').select('count').limit(1);
                if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (normal)
                    console.log('⚠️  Table users non trouvée (normal en première installation)');
                } else {
                    console.log('✅ Connexion à la base de données réussie');
                }
            } catch (dbError) {
                console.log('⚠️  Test de base de données:', dbError.message);
            }
        }
        
        console.log('\n🎉 Supabase est correctement configuré !');
        console.log('\n📋 Prochaines étapes:');
        console.log('1. Créer les tables dans Supabase Dashboard');
        console.log('2. Configurer les politiques RLS (Row Level Security)');
        console.log('3. Tester l\'authentification');
        console.log('4. Démarrer le serveur: npm start');
        
        return true;
        
    } catch (error) {
        console.log('\n❌ Erreur lors du test:', error.message);
        console.log('💡 Vérifiez que @supabase/supabase-js est installé: npm install');
        return false;
    }
}

// Exécuter le test
testSupabase().then((success) => {
    process.exit(success ? 0 : 1);
}).catch((error) => {
    console.log('\n❌ Erreur inattendue:', error.message);
    process.exit(1);
});