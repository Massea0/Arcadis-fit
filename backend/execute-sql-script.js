// Script pour exécuter les requêtes SQL sur Supabase
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function executeSupabaseSQL() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🗃️  Exécution du script SQL sur Supabase');
    console.log('==========================================');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Configuration Supabase manquante');
      return;
    }
    
    // Client avec clé service pour les opérations admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log(`📍 URL: ${supabaseUrl}`);
    console.log(`🔧 Lecture du fichier SQL...`);
    
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'create-missing-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log(`📄 Fichier SQL lu (${sqlContent.length} caractères)`);
    
    // Diviser le script en requêtes individuelles
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`🔢 ${sqlStatements.length} requêtes SQL trouvées`);
    console.log('\n🚀 Exécution des requêtes...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      
      // Ignorer les commentaires et lignes vides
      if (statement.startsWith('--') || statement.startsWith('SELECT \'Tables') || statement.length < 10) {
        continue;
      }
      
      // Extraire le type de requête pour l'affichage
      const queryType = statement.split(' ')[0].toUpperCase();
      const tableName = extractTableName(statement);
      
      try {
        console.log(`⏳ [${i + 1}/${sqlStatements.length}] ${queryType} ${tableName ? `(${tableName})` : ''}...`);
        
        // Exécuter la requête
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          // Fallback : essayer avec une requête directe simple
          if (queryType === 'CREATE' && statement.includes('TABLE')) {
            console.log(`⚠️  RPC échoué, tentative directe...`);
            
            // Pour les CREATE TABLE, essayons avec une approche différente
            const { error: directError } = await executeDirectSQL(supabase, statement);
            
            if (directError) {
              console.log(`❌ [${i + 1}] ERREUR - ${queryType}: ${directError.message}`);
              console.log(`   📝 Requête: ${statement.substring(0, 100)}...`);
              errorCount++;
            } else {
              console.log(`✅ [${i + 1}] SUCCÈS - ${queryType} ${tableName || ''}`);
              successCount++;
            }
          } else {
            console.log(`❌ [${i + 1}] ERREUR - ${queryType}: ${error.message}`);
            if (error.message.includes('already exists')) {
              console.log(`   ℹ️  Élément déjà existant (normal)`);
              successCount++;
            } else {
              console.log(`   📝 Requête: ${statement.substring(0, 100)}...`);
              errorCount++;
            }
          }
        } else {
          console.log(`✅ [${i + 1}] SUCCÈS - ${queryType} ${tableName || ''}`);
          successCount++;
        }
        
        // Petite pause pour éviter de surcharger
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (execError) {
        console.log(`❌ [${i + 1}] EXCEPTION - ${queryType}: ${execError.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 RÉSULTATS DE L\'EXÉCUTION');
    console.log('=============================');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📋 Total: ${successCount + errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 TOUTES LES REQUÊTES ONT RÉUSSI !');
    } else if (successCount > errorCount) {
      console.log('\n⚠️  Succès partiel - Vérifiez les erreurs ci-dessus');
    } else {
      console.log('\n❌ Échec de la plupart des requêtes');
    }
    
    // Vérifier les tables créées
    console.log('\n🔍 Vérification des tables créées...');
    await verifyCreatedTables(supabase);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error.message);
    console.error(error.stack);
  }
}

// Fonction pour extraire le nom de table d'une requête
function extractTableName(statement) {
  const createMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/i);
  if (createMatch) return createMatch[1];
  
  const alterMatch = statement.match(/ALTER\s+TABLE\s+(?:public\.)?(\w+)/i);
  if (alterMatch) return alterMatch[1];
  
  const insertMatch = statement.match(/INSERT\s+INTO\s+(?:public\.)?(\w+)/i);
  if (insertMatch) return insertMatch[1];
  
  return null;
}

// Fonction pour exécuter SQL directement
async function executeDirectSQL(supabase, statement) {
  try {
    // Pour les CREATE TABLE, essayons via une requête HTTP directe
    if (statement.includes('CREATE TABLE')) {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql_query: statement })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { error: { message: errorText } };
      }
      
      return { error: null };
    }
    
    return { error: { message: 'Type de requête non supporté pour l\'exécution directe' } };
  } catch (error) {
    return { error };
  }
}

// Fonction pour vérifier les tables créées
async function verifyCreatedTables(supabase) {
  const expectedTables = [
    'memberships',
    'nutrition', 
    'gym_checkins',
    'payment_methods',
    'user_preferences'
  ];
  
  console.log('Vérification des nouvelles tables...');
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ Table ${tableName} : Créée et accessible`);
      } else {
        console.log(`❌ Table ${tableName} : ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ Table ${tableName} : Erreur de vérification`);
    }
  }
  
  // Vérifier les méthodes de paiement insérées
  try {
    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select('name, code, is_active')
      .eq('is_active', true);
    
    if (!error && paymentMethods) {
      console.log(`\n💳 Méthodes de paiement créées (${paymentMethods.length}) :`);
      paymentMethods.forEach(method => {
        console.log(`   - ${method.name} (${method.code})`);
      });
    }
  } catch (error) {
    console.log('⚠️  Impossible de vérifier les méthodes de paiement');
  }
}

// Exécuter le script
if (require.main === module) {
  executeSupabaseSQL().then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { executeSupabaseSQL };