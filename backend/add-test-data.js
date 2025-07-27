// Script pour ajouter des données de test de base
require('dotenv').config();

async function addTestData() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('🗃️  Ajout de données de test sur Supabase');
    console.log('==========================================');
    
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
    
    // 1. Ajouter des salles de sport
    console.log('🏢 Ajout des salles de sport...');
    
    const gyms = [
      {
        name: 'FitZone Dakar',
        address: 'Avenue Bourguiba, Dakar',
        city: 'Dakar',
        region: 'Dakar',
        phone: '+221771234567',
        email: 'contact@fitzone-dakar.sn',
        latitude: 14.6928,
        longitude: -17.4467,
        opening_hours: { 
          monday: '06:00-22:00',
          tuesday: '06:00-22:00', 
          wednesday: '06:00-22:00',
          thursday: '06:00-22:00',
          friday: '06:00-22:00',
          saturday: '08:00-20:00',
          sunday: '08:00-20:00'
        },
        amenities: ['musculation', 'cardio', 'cours collectifs', 'vestiaires', 'parking'],
        rating: 4.5,
        price_range: '15000-50000',
        is_active: true
      },
      {
        name: 'Gym Plus Almadies',
        address: 'Route des Almadies, Dakar',
        city: 'Dakar', 
        region: 'Dakar',
        phone: '+221771234568',
        email: 'info@gymplus-almadies.sn',
        latitude: 14.7645,
        longitude: -17.5007,
        opening_hours: {
          monday: '05:30-23:00',
          tuesday: '05:30-23:00',
          wednesday: '05:30-23:00', 
          thursday: '05:30-23:00',
          friday: '05:30-23:00',
          saturday: '07:00-21:00',
          sunday: '07:00-21:00'
        },
        amenities: ['musculation', 'cardio', 'piscine', 'sauna', 'cours collectifs'],
        rating: 4.8,
        price_range: '25000-75000',
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
    
    // 2. Ajouter des exercices
    console.log('\n💪 Ajout des exercices...');
    
    const exercises = [
      {
        name: 'Développé couché',
        muscle_groups: ['pectoraux', 'triceps', 'deltoïdes'],
        category: 'musculation',
        equipment: 'barre_haltères',
        difficulty_level: 'intermediate',
        instructions: 'Allongé sur le banc, saisissez la barre avec les mains écartées de la largeur des épaules...',
        calories_per_minute: 8
      },
      {
        name: 'Squat',
        muscle_groups: ['quadriceps', 'fessiers', 'ischio-jambiers'],
        category: 'musculation', 
        equipment: 'barre_haltères',
        difficulty_level: 'beginner',
        instructions: 'Debout, pieds écartés largeur d\'épaules, descendez en pliant les genoux...',
        calories_per_minute: 10
      },
      {
        name: 'Traction',
        muscle_groups: ['dorsaux', 'biceps', 'avant-bras'],
        category: 'musculation',
        equipment: 'barre_fixe',
        difficulty_level: 'advanced',
        instructions: 'Suspendez-vous à la barre, tirez votre corps vers le haut...',
        calories_per_minute: 12
      },
      {
        name: 'Course à pied',
        muscle_groups: ['jambes', 'cardio'],
        category: 'cardio',
        equipment: 'aucun',
        difficulty_level: 'beginner',
        instructions: 'Courir à un rythme modéré en maintenant une bonne posture...',
        calories_per_minute: 15
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
    
    // 3. Ajouter des plans d'abonnement
    console.log('\n💳 Ajout des plans d\'abonnement...');
    
    const membershipPlans = [
      {
        name: 'Basique Mensuel',
        description: 'Accès basique à la salle de sport',
        price_xof: 15000,
        duration_days: 30,
        features: ['Accès aux équipements', 'Vestiaires'],
        is_active: true,
        plan_type: 'basic'
      },
      {
        name: 'Premium Mensuel', 
        description: 'Accès complet avec cours collectifs',
        price_xof: 25000,
        duration_days: 30,
        features: ['Accès aux équipements', 'Cours collectifs', 'Vestiaires', 'Suivi personnalisé'],
        is_active: true,
        plan_type: 'premium'
      },
      {
        name: 'VIP Mensuel',
        description: 'Accès VIP avec coach personnel',
        price_xof: 50000,
        duration_days: 30,
        features: ['Accès prioritaire', 'Coach personnel', 'Cours collectifs', 'Vestiaires premium', 'Suivi nutrition'],
        is_active: true,
        plan_type: 'vip'
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
    
    // 4. Ajouter des templates d'entraînement
    console.log('\n🏋️ Ajout des templates d\'entraînement...');
    
    const workoutTemplates = [
      {
        name: 'Push Day - Débutant',
        description: 'Entraînement pour les muscles pousseurs (pectoraux, épaules, triceps)',
        category: 'musculation',
        difficulty_level: 'beginner',
        estimated_duration: 45,
        calories_burned_estimate: 300,
        muscle_groups: ['pectoraux', 'épaules', 'triceps'],
        equipment_needed: ['banc', 'haltères', 'barre'],
        is_active: true
      },
      {
        name: 'Pull Day - Débutant',
        description: 'Entraînement pour les muscles tireurs (dos, biceps)',
        category: 'musculation',
        difficulty_level: 'beginner',
        estimated_duration: 45,
        calories_burned_estimate: 280,
        muscle_groups: ['dos', 'biceps'],
        equipment_needed: ['barre', 'haltères', 'machine'],
        is_active: true
      },
      {
        name: 'Cardio HIIT',
        description: 'Entraînement cardio haute intensité',
        category: 'cardio',
        difficulty_level: 'intermediate',
        estimated_duration: 30,
        calories_burned_estimate: 400,
        muscle_groups: ['cardio', 'jambes'],
        equipment_needed: ['aucun'],
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
    
    // Résumé
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
    
    console.log('\n🎉 Données de test ajoutées avec succès !');
    console.log('L\'API peut maintenant être testée avec des données réelles.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error.message);
  }
}

// Exécuter le script
if (require.main === module) {
  addTestData().then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { addTestData };