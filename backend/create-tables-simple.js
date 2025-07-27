// Script simplifié pour créer les tables manquantes sur Supabase
require('dotenv').config();

async function createMissingTables() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🗃️  Création des tables manquantes sur Supabase');
    console.log('===============================================');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('📋 Tables à créer:');
    console.log('   1. memberships (Abonnements)');
    console.log('   2. nutrition (Suivi nutritionnel)');
    console.log('   3. gym_checkins (Check-ins salles)');
    console.log('   4. payment_methods (Méthodes de paiement)');
    console.log('   5. user_preferences (Préférences utilisateur)');
    console.log('');
    
    // Approche: Utiliser directement l'interface Supabase pour vérifier et potentiellement créer via l'API REST
    const tablesToCreate = [
      {
        name: 'memberships',
        description: 'Abonnements des utilisateurs',
        created: false
      },
      {
        name: 'nutrition',
        description: 'Suivi nutritionnel',
        created: false
      },
      {
        name: 'gym_checkins',
        description: 'Check-ins dans les salles',
        created: false
      },
      {
        name: 'payment_methods',
        description: 'Méthodes de paiement',
        created: false
      },
      {
        name: 'user_preferences',
        description: 'Préférences utilisateur',
        created: false
      }
    ];
    
    // Vérifier quelles tables existent déjà
    console.log('🔍 Vérification des tables existantes...\n');
    
    for (const table of tablesToCreate) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table ${table.name} : Déjà existante`);
          table.created = true;
        } else {
          console.log(`❌ Table ${table.name} : À créer (${error.message})`);
        }
      } catch (testError) {
        console.log(`❌ Table ${table.name} : À créer`);
      }
    }
    
    const tablesToCreateList = tablesToCreate.filter(t => !t.created);
    
    if (tablesToCreateList.length === 0) {
      console.log('\n🎉 Toutes les tables existent déjà !');
      return;
    }
    
    console.log(`\n📝 ${tablesToCreateList.length} tables à créer:`);
    tablesToCreateList.forEach(t => console.log(`   - ${t.name}`));
    
    // Instructions pour créer manuellement via le dashboard Supabase
    console.log('\n📋 INSTRUCTIONS POUR CRÉER LES TABLES');
    console.log('=====================================');
    console.log('');
    console.log('🌐 Méthode recommandée : Via le Dashboard Supabase');
    console.log('');
    console.log('1. Allez sur https://supabase.com/dashboard');
    console.log(`2. Ouvrez votre projet: ${supabaseUrl}`);
    console.log('3. Allez dans "Table Editor"');
    console.log('4. Cliquez sur "Create a new table"');
    console.log('5. Copiez-collez le SQL du fichier create-missing-tables.sql');
    console.log('');
    console.log('🗂️  Ou utilisez l\'éditeur SQL:');
    console.log('1. Allez dans "SQL Editor"');
    console.log('2. Collez le contenu complet du fichier create-missing-tables.sql');
    console.log('3. Cliquez sur "Run"');
    console.log('');
    
    // Essayons d'ajouter au moins les méthodes de paiement de base
    console.log('💳 Tentative de création des méthodes de paiement...');
    
    try {
      // Test si payment_methods existe et ajouter des données
      const { data: existingMethods } = await supabase
        .from('payment_methods')
        .select('code')
        .limit(1);
      
      if (existingMethods !== null) {
        console.log('✅ Table payment_methods existe, ajout des méthodes de base...');
        
        const paymentMethods = [
          {
            name: 'Wave',
            code: 'WAVE',
            provider: 'wave',
            type: 'mobile_money',
            display_name_fr: 'Wave Money',
            is_active: true,
            is_default: true
          },
          {
            name: 'Orange Money',
            code: 'ORANGE_MONEY', 
            provider: 'orange_money',
            type: 'mobile_money',
            display_name_fr: 'Orange Money',
            is_active: true
          }
        ];
        
        for (const method of paymentMethods) {
          try {
            const { error } = await supabase
              .from('payment_methods')
              .insert(method);
            
            if (!error) {
              console.log(`   ✅ Méthode ${method.name} ajoutée`);
            } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
              console.log(`   ℹ️  Méthode ${method.name} existe déjà`);
            } else {
              console.log(`   ❌ Erreur pour ${method.name}: ${error.message}`);
            }
          } catch (insertError) {
            console.log(`   ❌ Exception pour ${method.name}: ${insertError.message}`);
          }
        }
      }
    } catch (paymentError) {
      console.log('⚠️  Impossible d\'ajouter les méthodes de paiement automatiquement');
    }
    
    // Instructions finales
    console.log('\n🎯 ÉTAPES SUIVANTES RECOMMANDÉES');
    console.log('================================');
    console.log('');
    console.log('1. 📁 Ouvrez le fichier: backend/create-missing-tables.sql');
    console.log('2. 📋 Copiez tout le contenu');
    console.log('3. 🌐 Allez sur votre Dashboard Supabase > SQL Editor');
    console.log('4. 📝 Collez le SQL et exécutez');
    console.log('5. ✅ Vérifiez que les tables sont créées');
    console.log('6. 🔄 Relancez ce script pour vérifier');
    console.log('');
    console.log('📞 En cas de problème:');
    console.log('   - Vérifiez que vous avez les droits admin sur Supabase');
    console.log('   - Exécutez les requêtes CREATE TABLE une par une');
    console.log('   - Consultez les logs d\'erreur dans le Dashboard');
    
    // Test de re-vérification
    console.log('\n🔄 Re-vérification dans 5 secondes...');
    console.log('(Appuyez sur Ctrl+C pour annuler)');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🔍 Nouvelle vérification...');
    
    let newTablesFound = 0;
    for (const table of tablesToCreate) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);
        
        if (!error) {
          if (!table.created) {
            console.log(`🆕 Table ${table.name} : NOUVELLEMENT CRÉÉE !`);
            newTablesFound++;
          } else {
            console.log(`✅ Table ${table.name} : Toujours présente`);
          }
          table.created = true;
        } else {
          console.log(`❌ Table ${table.name} : Toujours manquante`);
        }
      } catch (testError) {
        console.log(`❌ Table ${table.name} : Toujours manquante`);
      }
    }
    
    if (newTablesFound > 0) {
      console.log(`\n🎉 ${newTablesFound} nouvelles tables détectées !`);
    } else {
      console.log('\n⏳ Aucune nouvelle table détectée - Veuillez suivre les instructions ci-dessus');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    console.error(error.stack);
  }
}

// Exécuter le script
if (require.main === module) {
  createMissingTables().then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { createMissingTables };