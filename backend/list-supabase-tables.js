// Script pour lister les tables Supabase
require('dotenv').config();

async function listSupabaseTables() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🔍 Liste des tables Supabase');
    console.log('============================');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Configuration Supabase manquante');
      return;
    }
    
    console.log(`📍 URL: ${supabaseUrl}`);
    
    // Client avec clé service pour accès complet
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('\n🔍 Recherche des tables...\n');
    
    // Méthode 1: Query directe sur information_schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      console.log('⚠️  Méthode 1 échouée, essai méthode alternative...');
      
      // Méthode 2: Utilisation de rpc pour lister les tables
      const { data: rpcTables, error: rpcError } = await supabase.rpc('get_tables');
      
      if (rpcError) {
        console.log('⚠️  Méthode 2 échouée, essai méthode 3...');
        
        // Méthode 3: Test direct sur des tables connues
        const knownTables = [
          'users', 'profiles', 'memberships', 'payments', 'gyms', 
          'workouts', 'exercises', 'nutrition', 'notifications',
          'workout_templates', 'workout_sessions', 'gym_checkins',
          'membership_plans', 'payment_methods', 'user_preferences'
        ];
        
        console.log('📋 Test des tables courantes d\'Arcadis Fit:');
        console.log('=============================================');
        
        for (const tableName of knownTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!error) {
              console.log(`✅ ${tableName} - Table existe et accessible`);
              
              // Obtenir le schéma de la table
              const { data: columns } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable')
                .eq('table_name', tableName)
                .eq('table_schema', 'public');
              
              if (columns && columns.length > 0) {
                console.log(`   📊 Colonnes (${columns.length}):`);
                columns.forEach(col => {
                  console.log(`      - ${col.column_name} (${col.data_type}${col.is_nullable === 'YES' ? ', nullable' : ', not null'})`);
                });
              }
              console.log('');
            } else {
              console.log(`❌ ${tableName} - Erreur: ${error.message}`);
            }
          } catch (testError) {
            console.log(`❌ ${tableName} - Table inexistante ou inaccessible`);
          }
        }
      } else {
        console.log('✅ Tables trouvées via RPC:');
        console.log(rpcTables);
      }
    } else {
      console.log('✅ Tables trouvées via information_schema:');
      console.log('==========================================');
      
      if (tables && tables.length > 0) {
        tables.forEach((table, index) => {
          console.log(`${index + 1}. 📋 ${table.table_name} (schema: ${table.table_schema})`);
        });
        
        console.log(`\n📊 Total: ${tables.length} tables trouvées`);
        
        // Détails pour chaque table
        console.log('\n🔍 Détails des tables:');
        console.log('======================');
        
        for (const table of tables.slice(0, 10)) { // Limiter à 10 premières tables
          try {
            const { data: columns } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type, is_nullable, column_default')
              .eq('table_name', table.table_name)
              .eq('table_schema', 'public')
              .order('ordinal_position');
            
            console.log(`\n📋 Table: ${table.table_name}`);
            if (columns && columns.length > 0) {
              console.log('   Colonnes:');
              columns.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
              });
            }
          } catch (detailError) {
            console.log(`   ❌ Impossible d'obtenir les détails: ${detailError.message}`);
          }
        }
      } else {
        console.log('📭 Aucune table trouvée dans le schema public');
      }
    }
    
    // Test de connexion général
    console.log('\n🔗 Test de connexion:');
    console.log('=====================');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      console.log(`✅ Auth: ${authUsers?.users?.length || 0} utilisateurs trouvés`);
    } catch (authTestError) {
      console.log(`⚠️  Auth: ${authTestError.message}`);
    }
    
    // Test storage
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      console.log(`✅ Storage: ${buckets?.length || 0} buckets trouvés`);
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
        });
      }
    } catch (storageTestError) {
      console.log(`⚠️  Storage: ${storageTestError.message}`);
    }
    
    console.log('\n✅ Analyse terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
    console.error(error.stack);
  }
}

// Exécuter le script
listSupabaseTables().then(() => {
  console.log('\n🎯 Script terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});