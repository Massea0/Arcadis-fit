// Script pour inspecter la structure réelle des tables existantes
require('dotenv').config();

async function inspectRealTables() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🔍 Inspection de la structure réelle des tables');
    console.log('===============================================');
    
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
    
    // Tables à inspecter
    const tables = ['gyms', 'workouts', 'workout_templates', 'exercises', 'membership_plans'];
    
    for (const tableName of tables) {
      console.log(`\n📋 TABLE: ${tableName.toUpperCase()}`);
      console.log('='.repeat(50));
      
      try {
        // Obtenir un échantillon pour voir les colonnes
        const { data: sample, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          if (sample && sample.length > 0) {
            console.log('✅ Table accessible avec données');
            console.log('📊 Colonnes détectées:');
            Object.keys(sample[0]).forEach((col, index) => {
              const value = sample[0][col];
              const type = typeof value;
              const sampleValue = value === null ? 'NULL' : 
                                 typeof value === 'string' && value.length > 30 ? 
                                 value.substring(0, 30) + '...' : value;
              console.log(`   ${index + 1}. ${col} (${type}) = ${sampleValue}`);
            });
          } else {
            console.log('✅ Table accessible mais vide');
            
            // Essayer d'obtenir la structure en insérant puis supprimant
            try {
              const { error: insertError } = await supabase
                .from(tableName)
                .insert({});
              
              if (insertError) {
                console.log('📊 Structure déduite des erreurs de validation:');
                console.log(`   Error: ${insertError.message}`);
                
                // Extraire les colonnes requises du message d'erreur
                if (insertError.message.includes('null value in column')) {
                  const matches = insertError.message.matchAll(/null value in column "([^"]+)"/g);
                  for (const match of matches) {
                    console.log(`   - ${match[1]} (requis)`);
                  }
                }
              }
            } catch (structError) {
              console.log('⚠️  Impossible de déduire la structure');
            }
          }
        } else {
          console.log(`❌ Table inaccessible: ${error.message}`);
        }
      } catch (tableError) {
        console.log(`❌ Erreur d'inspection: ${tableError.message}`);
      }
    }
    
    // Test spécifique pour les problèmes identifiés
    console.log('\n🔧 TESTS SPÉCIFIQUES POUR LES ERREURS');
    console.log('=====================================');
    
    // Test 1: Colonnes de gyms
    console.log('\n1. Test des colonnes de la table GYMS:');
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, name')
        .limit(1);
      
      if (!error) {
        console.log('✅ Colonnes id, name accessibles');
        
        // Test description
        const { error: descError } = await supabase
          .from('gyms')
          .select('description')
          .limit(1);
        
        if (descError) {
          console.log('❌ Colonne description manquante');
          console.log('💡 Solution: Utiliser d\'autres colonnes ou créer la colonne');
        } else {
          console.log('✅ Colonne description accessible');
        }
      }
    } catch (gymError) {
      console.log(`❌ Erreur test gyms: ${gymError.message}`);
    }
    
    // Test 2: Colonnes de exercises
    console.log('\n2. Test des colonnes de la table EXERCISES:');
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name')
        .limit(1);
      
      if (!error) {
        console.log('✅ Colonnes id, name accessibles');
        
        // Test muscle_group vs muscle_groups
        const { error: muscleError } = await supabase
          .from('exercises')
          .select('muscle_group')
          .limit(1);
        
        if (muscleError) {
          console.log('❌ Colonne muscle_group manquante');
          
          const { error: musclesError } = await supabase
            .from('exercises')
            .select('muscle_groups')
            .limit(1);
          
          if (musclesError) {
            console.log('❌ Colonne muscle_groups aussi manquante');
          } else {
            console.log('✅ Colonne muscle_groups existe (pluriel)');
          }
        } else {
          console.log('✅ Colonne muscle_group accessible');
        }
      }
    } catch (exerciseError) {
      console.log(`❌ Erreur test exercises: ${exerciseError.message}`);
    }
    
    // Recommandations
    console.log('\n💡 RECOMMANDATIONS');
    console.log('==================');
    console.log('1. Adapter les contrôleurs aux colonnes réelles');
    console.log('2. Ajouter les colonnes manquantes si nécessaire');
    console.log('3. Utiliser des colonnes alternatives');
    console.log('4. Créer des données de test pour les tables vides');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'inspection:', error.message);
  }
}

// Exécuter le script
if (require.main === module) {
  inspectRealTables().then(() => {
    console.log('\n✅ Inspection terminée');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { inspectRealTables };