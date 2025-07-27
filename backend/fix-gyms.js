const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addGyms() {
  const gyms = [
    { name: 'FitZone Dakar', address: 'Avenue Bourguiba, Dakar', city: 'Dakar' },
    { name: 'Gym Plus Almadies', address: 'Route des Almadies, Dakar', city: 'Dakar' }
  ];
  
  for (const gym of gyms) {
    try {
      const { data, error } = await supabase.from('gyms').insert(gym).select().single();
      if (!error) {
        console.log('✅ Salle ' + gym.name + ' ajoutée');
      } else {
        console.log('❌ Erreur pour ' + gym.name + ': ' + error.message);
      }
    } catch (e) {
      console.log('❌ Exception: ' + e.message);
    }
  }
}

addGyms();