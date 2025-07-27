// Script de vérification rapide des tables créées
require('dotenv').config();

async function verifyTablesCreated() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🔍 Vérification des tables créées sur Supabase');
    console.log('==============================================');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const expectedTables = [
      { name: 'memberships', description: 'Abonnements utilisateurs' },
      { name: 'nutrition', description: 'Suivi nutritionnel' },
      { name: 'gym_checkins', description: 'Check-ins dans les salles' },
      { name: 'payment_methods', description: 'Méthodes de paiement' },
      { name: 'user_preferences', description: 'Préférences utilisateur' }
    ];
    
    let tablesCreated = 0;
    let totalTables = expectedTables.length;
    
    console.log(`📋 Vérification de ${totalTables} tables...\n`);
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${table.name} - CRÉÉE ET ACCESSIBLE`);
          
          // Compter les enregistrements
          const { count } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true });
          
          console.log(`   📊 ${count || 0} enregistrements`);
          tablesCreated++;
        } else {
          console.log(`❌ ${table.name} - MANQUANTE`);
          console.log(`   🔍 Erreur: ${error.message}`);
        }
      } catch (testError) {
        console.log(`❌ ${table.name} - ERREUR`);
        console.log(`   🔍 Exception: ${testError.message}`);
      }
      
      console.log('');
    }
    
    // Résumé
    console.log('📊 RÉSUMÉ DE LA VÉRIFICATION');
    console.log('============================');
    console.log(`✅ Tables créées: ${tablesCreated}/${totalTables}`);
    console.log(`❌ Tables manquantes: ${totalTables - tablesCreated}/${totalTables}`);
    
    if (tablesCreated === totalTables) {
      console.log('\n🎉 SUCCÈS COMPLET !');
      console.log('Toutes les tables ont été créées avec succès !');
      
      // Vérifier les méthodes de paiement
      try {
        const { data: paymentMethods } = await supabase
          .from('payment_methods')
          .select('name, code, is_active, is_default')
          .eq('is_active', true);
        
        if (paymentMethods && paymentMethods.length > 0) {
          console.log(`\n💳 Méthodes de paiement disponibles (${paymentMethods.length}):`);
          paymentMethods.forEach(method => {
            const defaultText = method.is_default ? ' [PAR DÉFAUT]' : '';
            console.log(`   - ${method.name} (${method.code})${defaultText}`);
          });
        }
      } catch (paymentError) {
        console.log('\n⚠️  Impossible de vérifier les méthodes de paiement');
      }
      
      console.log('\n🚀 PROCHAINES ÉTAPES:');
      console.log('1. Tester les nouveaux endpoints API');
      console.log('2. Ajouter des données de test si nécessaire');
      console.log('3. Mettre à jour les contrôleurs si besoin');
      console.log('4. Tester l\'application complète');
      
    } else if (tablesCreated > 0) {
      console.log('\n⚠️  SUCCÈS PARTIEL');
      console.log(`${tablesCreated} tables créées sur ${totalTables}`);
      console.log('\n📋 Actions recommandées:');
      console.log('1. Vérifiez les erreurs ci-dessus');
      console.log('2. Re-exécutez le script SQL pour les tables manquantes');
      console.log('3. Vérifiez les permissions sur Supabase');
      
    } else {
      console.log('\n❌ AUCUNE TABLE CRÉÉE');
      console.log('\n📋 Actions requises:');
      console.log('1. Allez sur https://supabase.com/dashboard');
      console.log('2. Ouvrez SQL Editor');
      console.log('3. Exécutez le contenu de create-missing-tables.sql');
      console.log('4. Relancez ce script de vérification');
    }
    
    console.log('\n🔄 Pour re-vérifier: node verify-tables-created.js');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

// Exécuter le script
if (require.main === module) {
  verifyTablesCreated().then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { verifyTablesCreated };