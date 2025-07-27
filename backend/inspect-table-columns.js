// Script pour inspecter les colonnes des tables Supabase existantes
require('dotenv').config();

async function inspectTableColumns() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🔍 Inspection des colonnes des tables Supabase');
    console.log('===============================================');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Tables existantes identifiées
    const existingTables = [
      'users', 'profiles', 'payments', 'gyms', 'workouts', 
      'exercises', 'notifications', 'workout_templates', 
      'workout_sessions', 'membership_plans'
    ];
    
    console.log(`📊 Analyse de ${existingTables.length} tables...\n`);
    
    for (const tableName of existingTables) {
      console.log(`📋 TABLE: ${tableName.toUpperCase()}`);
      console.log('='.repeat(50));
      
      try {
        // Obtenir les colonnes via information_schema
        const { data: columns, error } = await supabase.rpc('get_table_columns', { 
          table_name: tableName 
        });
        
        if (error) {
          // Fallback : requête directe
          const { data: fallbackColumns, error: fallbackError } = await supabase
            .from('information_schema.columns')
            .select(`
              column_name,
              data_type,
              is_nullable,
              column_default,
              character_maximum_length,
              ordinal_position
            `)
            .eq('table_name', tableName)
            .eq('table_schema', 'public')
            .order('ordinal_position');
          
          if (fallbackError) {
            console.log(`❌ Impossible d'obtenir les colonnes: ${fallbackError.message}`);
            
            // Dernier fallback : test avec select *
            const { data: sampleData, error: sampleError } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!sampleError && sampleData && sampleData.length > 0) {
              console.log('📊 Colonnes détectées via échantillon:');
              const columnNames = Object.keys(sampleData[0]);
              columnNames.forEach((col, index) => {
                const value = sampleData[0][col];
                const type = typeof value;
                console.log(`   ${index + 1}. ${col} (type: ${type})`);
              });
            } else {
              console.log('❌ Table vide ou inaccessible');
            }
          } else {
            displayColumns(fallbackColumns);
          }
        } else {
          displayColumns(columns);
        }
        
        // Test d'un échantillon de données
        try {
          const { data: sample, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(3);
          
          if (!sampleError && sample) {
            console.log(`\n📈 Échantillon de données (${sample.length} lignes):`);
            if (sample.length === 0) {
              console.log('   (Table vide)');
            } else {
              console.log('   Exemple d\'enregistrement:');
              const firstRecord = sample[0];
              Object.entries(firstRecord).forEach(([key, value]) => {
                const displayValue = value === null ? 'NULL' : 
                                  typeof value === 'string' && value.length > 50 ? 
                                  value.substring(0, 50) + '...' : value;
                console.log(`     ${key}: ${displayValue}`);
              });
            }
          }
        } catch (sampleError) {
          console.log('   ⚠️  Impossible d\'obtenir un échantillon');
        }
        
        console.log('\n');
        
      } catch (tableError) {
        console.log(`❌ Erreur pour la table ${tableName}: ${tableError.message}\n`);
      }
    }
    
    // Résumé final
    console.log('📊 RÉSUMÉ DES TABLES DISPONIBLES');
    console.log('=================================');
    
    const tableStatus = {
      existantes: [],
      manquantes: ['memberships', 'nutrition', 'gym_checkins', 'payment_methods', 'user_preferences']
    };
    
    for (const table of existingTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
          tableStatus.existantes.push(table);
        }
      } catch (e) {
        tableStatus.manquantes.push(table);
      }
    }
    
    console.log(`✅ Tables existantes (${tableStatus.existantes.length}):`);
    tableStatus.existantes.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    console.log(`\n❌ Tables manquantes (${tableStatus.manquantes.length}):`);
    tableStatus.manquantes.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    console.log('\n🎯 Recommandations:');
    console.log('1. Créer les tables manquantes');
    console.log('2. Vérifier les colonnes des tables existantes');
    console.log('3. Adapter les contrôleurs aux colonnes disponibles');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'inspection:', error.message);
  }
}

function displayColumns(columns) {
  if (!columns || columns.length === 0) {
    console.log('❌ Aucune colonne trouvée');
    return;
  }
  
  console.log(`📊 Colonnes (${columns.length}):`);
  columns.forEach((col, index) => {
    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
    
    console.log(`   ${index + 1}. ${col.column_name}`);
    console.log(`      Type: ${col.data_type}${length}`);
    console.log(`      Contraintes: ${nullable}${defaultVal}`);
    console.log('');
  });
}

// Exécuter le script
inspectTableColumns().then(() => {
  console.log('\n✅ Inspection terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});