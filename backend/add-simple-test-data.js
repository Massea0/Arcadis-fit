// Script pour ajouter des données de test simples
require('dotenv').config();

async function addSimpleTestData() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🗃️  Ajout de données simples sur Supabase');
    console.log('=========================================');
    
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
    
    // 1. Ajouter des salles de sport (colonnes minimales)
    console.log('🏢 Ajout des salles de sport...');
    
    const gyms = [
      {
        name: 'FitZone Dakar',
        address: 'Avenue Bourguiba, Dakar',
        city: 'Dakar',
        region: 'Dakar',
        phone: '+221771234567',
        email: 'contact@fitzone-dakar.sn',
        is_active: true
      },
      {
        name: 'Gym Plus Almadies',
        address: 'Route des Almadies, Dakar',
        city: 'Dakar', 
        region: 'Dakar',
        phone: '+221771234568',
        email: 'info@gymplus-almadies.sn',
        is_active: true
      }
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
    
    // 2. Ajouter des exercices (colonnes minimales)
    console.log('\n💪 Ajout des exercices...');
    
    const exercises = [
      {
        name: 'Développé couché',
        muscle_groups: ['pectoraux', 'triceps'],
        category: 'musculation',
        difficulty_level: 'intermediate'
      },
      {
        name: 'Squat',
        muscle_groups: ['quadriceps', 'fessiers'],
        category: 'musculation',
        difficulty_level: 'beginner'
      },
      {
        name: 'Traction',
        muscle_groups: ['dorsaux', 'biceps'],
        category: 'musculation',
        difficulty_level: 'advanced'
      },
      {
        name: 'Course à pied',
        muscle_groups: ['jambes'],
        category: 'cardio',
        difficulty_level: 'beginner'
      }
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
    
    // 3. Ajouter des plans d'abonnement (colonnes minimales)
    console.log('\n💳 Ajout des plans d\'abonnement...');
    
    const membershipPlans = [
      {
        name: 'Basique Mensuel',
        price_xof: 15000,
        duration_days: 30,
        is_active: true
      },
      {
        name: 'Premium Mensuel', 
        price_xof: 25000,
        duration_days: 30,
        is_active: true
      },
      {
        name: 'VIP Mensuel',
        price_xof: 50000,
        duration_days: 30,
        is_active: true
      }
    ];
    
    for (const plan of membershipPlans) {
      try {
        const { data, error } = await supabase
          .from('membership_plans')
          .insert(plan)
          .select()
          .single();
        
        if (!error) {
          console.log(`✅ Plan ${plan.name} ajouté`);
        } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          console.log(`ℹ️  Plan ${plan.name} existe déjà`);
        } else {
          console.log(`❌ Erreur pour ${plan.name}: ${error.message}`);
        }
      } catch (planError) {
        console.log(`❌ Exception pour ${plan.name}: ${planError.message}`);
      }
    }
    
    // 4. Ajouter des templates d'entraînement (colonnes minimales)
    console.log('\n🏋️ Ajout des templates d\'entraînement...');
    
    const workoutTemplates = [
      {
        name: 'Push Day - Débutant',
        category: 'musculation',
        difficulty_level: 'beginner',
        estimated_duration: 45,
        is_active: true
      },
      {
        name: 'Pull Day - Débutant',
        category: 'musculation',
        difficulty_level: 'beginner',
        estimated_duration: 45,
        is_active: true
      },
      {
        name: 'Cardio HIIT',
        category: 'cardio',
        difficulty_level: 'intermediate',
        estimated_duration: 30,
        is_active: true
      }
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
    
    // Test des API
    console.log('\n🔧 TEST DES ENDPOINTS');
    console.log('=====================');
    
    try {
      // Test gyms
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('id, name, city')
        .limit(2);
      
      if (!gymsError && gymsData) {
        console.log(`✅ API Gyms: ${gymsData.length} salles récupérées`);
      } else {
        console.log(`❌ API Gyms: ${gymsError?.message}`);
      }
      
      // Test workout templates  
      const { data: templatesData, error: templatesError } = await supabase
        .from('workout_templates')
        .select('id, name, category')
        .limit(3);
      
      if (!templatesError && templatesData) {
        console.log(`✅ API Templates: ${templatesData.length} templates récupérés`);
      } else {
        console.log(`❌ API Templates: ${templatesError?.message}`);
      }
      
      // Test membership plans
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('id, name, price_xof')
        .limit(3);
      
      if (!plansError && plansData) {
        console.log(`✅ API Plans: ${plansData.length} plans récupérés`);
      } else {
        console.log(`❌ API Plans: ${plansError?.message}`);
      }
      
    } catch (testError) {
      console.log(`⚠️  Erreur lors des tests: ${testError.message}`);
    }
    
    console.log('\n🎉 Données de test ajoutées avec succès !');
    console.log('L\'API peut maintenant être testée avec des données réelles.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error.message);
  }
}

// Exécuter le script
if (require.main === module) {
  addSimpleTestData().then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { addSimpleTestData };