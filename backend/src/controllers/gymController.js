const { supabase } = require('../utils/supabase');
// Logger simple pour éviter les imports circulaires
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};

class GymController {
  /**
   * Get all gyms with filters
   */
  async getAllGyms(req, res) {
    try {
      const { city, region, page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('gyms')
        .select(`
          id,
          name,
          address,
          city,
          phone,
          email,
          created_at
        `)
        .eq('is_active', true);

      // Filtres
      if (city) query = query.eq('city', city);
      if (region) query = query.eq('region', region);
      if (search) {
        query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%, city.ilike.%${search}%`);
      }

      // Pagination
      query = query.range(offset, offset + limit - 1).order('name');

      const { data: gyms, error } = await query;

      if (error) {
        logger.error('Get gyms error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des salles'
        });
      }

      res.json({
        success: true,
        data: {
          gyms,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: gyms.length === parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get gyms error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get gym by ID
   */
  async getGymById(req, res) {
    try {
      const { gymId } = req.params;

      const { data: gym, error } = await supabase
        .from('gyms')
        .select(`
          *,
          membership_plans(
            id,
            name,
            description,
            price_xof,
            duration_days,
            features,
            is_active
          ),
          reviews:gym_reviews(
            id,
            user_id,
            rating,
            comment,
            created_at,
            users(full_name, profile_picture_url)
          )
        `)
        .eq('id', gymId)
        .eq('is_active', true)
        .single();

      if (error || !gym) {
        return res.status(404).json({
          success: false,
          error: 'Salle de sport non trouvée'
        });
      }

      // Calculer la note moyenne
      const avgRating = gym.reviews?.length > 0
        ? gym.reviews.reduce((sum, review) => sum + review.rating, 0) / gym.reviews.length
        : 0;

      res.json({
        success: true,
        data: {
          gym: {
            ...gym,
            average_rating: Math.round(avgRating * 10) / 10,
            total_reviews: gym.reviews?.length || 0
          }
        }
      });

    } catch (error) {
      logger.error('Get gym by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get gyms near location
   */
  async getGymsNearby(req, res) {
    try {
      const { lat, lng, radius = 10 } = req.query; // radius en km

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitude et longitude requises'
        });
      }

      // Utiliser la formule haversine pour calculer la distance
      const { data: gyms, error } = await supabase.rpc('gyms_nearby', {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius_km: parseFloat(radius)
      });

      if (error) {
        logger.error('Get nearby gyms error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la recherche de salles proches'
        });
      }

      res.json({
        success: true,
        data: {
          gyms,
          search_params: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            radius_km: parseFloat(radius)
          }
        }
      });

    } catch (error) {
      logger.error('Get nearby gyms error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Create gym review
   */
  async createReview(req, res) {
    try {
      const userId = req.user.id;
      const { gymId } = req.params;
      const { rating, comment } = req.body;

      // Vérifier si l'utilisateur a déjà laissé un avis
      const { data: existingReview } = await supabase
        .from('gym_reviews')
        .select('id')
        .eq('gym_id', gymId)
        .eq('user_id', userId)
        .single();

      if (existingReview) {
        return res.status(409).json({
          success: false,
          error: 'Vous avez déjà laissé un avis pour cette salle'
        });
      }

      // Créer l'avis
      const { data: review, error } = await supabase
        .from('gym_reviews')
        .insert({
          gym_id: gymId,
          user_id: userId,
          rating,
          comment,
          created_at: new Date().toISOString()
        })
        .select(`
          id,
          rating,
          comment,
          created_at,
          users(full_name, profile_picture_url)
        `)
        .single();

      if (error) {
        logger.error('Create review error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création de l\'avis'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Avis créé avec succès',
        data: { review }
      });

    } catch (error) {
      logger.error('Create review error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Check-in to gym using QR code
   */
  async checkIn(req, res) {
    try {
      const userId = req.user.id;
      const { qrCode, gymId } = req.body;

      // Vérifier le QR code
      const { data: qrData, error: qrError } = await supabase
        .from('gym_qr_codes')
        .select('*')
        .eq('code', qrCode)
        .eq('gym_id', gymId)
        .eq('is_active', true)
        .single();

      if (qrError || !qrData) {
        return res.status(400).json({
          success: false,
          error: 'QR Code invalide ou expiré'
        });
      }

      // Vérifier que l'utilisateur a un abonnement actif
      const { data: membership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Abonnement requis pour accéder à la salle'
        });
      }

      // Enregistrer le check-in
      const { data: checkIn, error: checkInError } = await supabase
        .from('gym_checkins')
        .insert({
          user_id: userId,
          gym_id: gymId,
          membership_id: membership.id,
          checked_in_at: new Date().toISOString()
        })
        .select(`
          id,
          checked_in_at,
          gyms(name, address)
        `)
        .single();

      if (checkInError) {
        logger.error('Check-in error:', checkInError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de l\'enregistrement'
        });
      }

      res.json({
        success: true,
        message: 'Check-in réussi',
        data: { checkIn }
      });

    } catch (error) {
      logger.error('Check-in error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get user check-in history
   */
  async getCheckInHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: checkIns, error } = await supabase
        .from('gym_checkins')
        .select(`
          id,
          checked_in_at,
          checked_out_at,
          duration_minutes,
          gyms(id, name, address, city)
        `)
        .eq('user_id', userId)
        .order('checked_in_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Get check-in history error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération de l\'historique'
        });
      }

      res.json({
        success: true,
        data: {
          checkIns,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: checkIns.length === parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get check-in history error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Check-out from gym
   */
  async checkOut(req, res) {
    try {
      const userId = req.user.id;
      const { checkInId } = req.params;

      // Récupérer le check-in
      const { data: checkIn, error: getError } = await supabase
        .from('gym_checkins')
        .select('*')
        .eq('id', checkInId)
        .eq('user_id', userId)
        .is('checked_out_at', null)
        .single();

      if (getError || !checkIn) {
        return res.status(404).json({
          success: false,
          error: 'Check-in non trouvé ou déjà terminé'
        });
      }

      // Calculer la durée
      const checkOutTime = new Date();
      const checkInTime = new Date(checkIn.checked_in_at);
      const durationMinutes = Math.round((checkOutTime - checkInTime) / (1000 * 60));

      // Mettre à jour le check-out
      const { data: updatedCheckIn, error: updateError } = await supabase
        .from('gym_checkins')
        .update({
          checked_out_at: checkOutTime.toISOString(),
          duration_minutes: durationMinutes
        })
        .eq('id', checkInId)
        .select()
        .single();

      if (updateError) {
        logger.error('Check-out error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors du check-out'
        });
      }

      res.json({
        success: true,
        message: 'Check-out réussi',
        data: {
          checkIn: updatedCheckIn,
          duration_minutes: durationMinutes
        }
      });

    } catch (error) {
      logger.error('Check-out error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get gym statistics (admin)
   */
  async getGymStats(req, res) {
    try {
      const { gymId } = req.params;
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      if (startDate && endDate) {
        dateFilter = `AND checked_in_at BETWEEN '${startDate}' AND '${endDate}'`;
      }

      // Statistiques de fréquentation
      const { data: stats, error } = await supabase.rpc('get_gym_statistics', {
        gym_id: gymId,
        start_date: startDate,
        end_date: endDate
      });

      if (error) {
        logger.error('Get gym stats error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des statistiques'
        });
      }

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('Get gym stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new GymController();