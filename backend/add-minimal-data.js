// Script pour ajouter des données minimales avec seulement les colonnes obligatoires
require('dotenv').config();

async function addMinimalData() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🗃️  Ajout de données minimales sur Supabase');
    console.log('=============================================');
    
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
    
    // 1. Ajouter des salles de sport (nom seulement)
    console.log('🏢 Ajout des salles de sport...');
    
    const gyms = [
      { name: 'FitZone Dakar' },
      { name: 'Gym Plus Almadies' },
      { name: 'Power Gym Sacré Coeur' }
    ];
    
    for (const gym of gyms) {
      try {
        const { data, error } = await supabase
          .from('gyms')
          .insert(gym)
          .select()
          .single();
        
        if (!error) {
          console.log(`✅ Salle ${gym.name} ajoutée`);
        } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          console.log(`ℹ️  Salle ${gym.name} existe déjà`);
        } else {
          console.log(`❌ Erreur pour ${gym.name}: ${error.message}`);
        }
      } catch (gymError) {
        console.log(`❌ Exception pour ${gym.name}: ${gymError.message}`);
      }
    }
    
    // 2. Ajouter des exercices (nom seulement)
    console.log('\n💪 Ajout des exercices...');
    
    const exercises = [
      { name: 'Développé couché' },
      { name: 'Squat' },
      { name: 'Traction' },
      { name: 'Course à pied' },
      { name: 'Pompes' }
    ];
    
    for (const exercise of exercises) {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .insert(exercise)
          .select()
          .single();
        
        if (!error) {
          console.log(`✅ Exercice ${exercise.name} ajouté`);
        } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          console.log(`ℹ️  Exercice ${exercise.name} existe déjà`);
        } else {
          console.log(`❌ Erreur pour ${exercise.name}: ${error.message}`);
        }
      } catch (exerciseError) {
        console.log(`❌ Exception pour ${exercise.name}: ${exerciseError.message}`);
      }
    }
    
    // 3. Ajouter des templates d'entraînement (nom seulement)
    console.log('\n🏋️ Ajout des templates d\'entraînement...');
    
    const workoutTemplates = [
      { name: 'Push Day - Débutant' },
      { name: 'Pull Day - Débutant' },
      { name: 'Leg Day - Débutant' },
      { name: 'Cardio HIIT' },
      { name: 'Full Body' }
    ];
    
    for (const template of workoutTemplates) {
      try {
        const { data, error } = await supabase
          .from('workout_templates')
          .insert(template)
          .select()
          .single();
        
        if (!error) {
          console.log(`✅ Template ${template.name} ajouté`);
        } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          console.log(`ℹ️  Template ${template.name} existe déjà`);
        } else {
          console.log(`❌ Erreur pour ${template.name}: ${error.message}`);
        }
      } catch (templateError) {
        console.log(`❌ Exception pour ${template.name}: ${templateError.message}`);
      }
    }
    
    // Résumé final
    console.log('\n📊 RÉSUMÉ DES DONNÉES AJOUTÉES');
    console.log('==============================');
    
    const tables = ['gyms', 'exercises', 'membership_plans', 'workout_templates'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`📋 ${table}: ${count} enregistrements`);
        }
      } catch (countError) {
        console.log(`📋 ${table}: Erreur de comptage`);
      }
    }
    
    console.log('\n🎉 Données minimales ajoutées avec succès !');
    console.log('L\'API peut maintenant répondre avec des données de base.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error.message);
  }
}

// Exécuter le script
if (require.main === module) {
  addMinimalData().then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { addMinimalData };