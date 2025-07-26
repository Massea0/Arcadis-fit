const express = require('express');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

const { logger } = require('../utils/logger');
const { asyncHandler, validationErrorHandler, APIError } = require('../middleware/errorHandler');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * @route GET /api/gyms
 * @desc Get all gyms with optional filtering
 * @access Private
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { 
      status = 'active', 
      location, 
      facilities, 
      limit = 20, 
      offset = 0,
      lat,
      lng,
      radius = 10
    } = req.query;

    try {
      let query = supabase
        .from('gyms')
        .select(`
          id,
          name,
          description,
          location,
          address,
          phone,
          email,
          website,
          operating_hours,
          facilities,
          image_url,
          capacity,
          current_members,
          rating,
          membership_plans,
          location_lat,
          location_lng,
          status,
          created_at,
          updated_at
        `)
        .eq('status', status);

      // Apply location filter if coordinates provided
      if (lat && lng) {
        // This is a simplified distance calculation
        // In production, you might want to use PostGIS or similar
        const { data: allGyms, error } = await query;

        if (error) {
          logger.error('Error fetching gyms:', error);
          throw new APIError('Failed to fetch gyms', 500);
        }

        // Filter by distance
        const nearbyGyms = allGyms.filter(gym => {
          if (!gym.location_lat || !gym.location_lng) return false;
          
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            gym.location_lat,
            gym.location_lng
          );

          return distance <= parseFloat(radius);
        });

        // Sort by distance
        nearbyGyms.sort((a, b) => {
          const distanceA = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            a.location_lat,
            a.location_lng
          );
          const distanceB = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            b.location_lat,
            b.location_lng
          );
          return distanceA - distanceB;
        });

        // Apply pagination
        const paginatedGyms = nearbyGyms.slice(offset, offset + parseInt(limit));

        res.json({
          success: true,
          message: 'Nearby gyms retrieved successfully',
          data: {
            gyms: paginatedGyms,
            total: nearbyGyms.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        });
      } else {
        // Apply other filters
        if (location) {
          query = query.ilike('location', `%${location}%`);
        }

        if (facilities) {
          const facilityArray = facilities.split(',');
          facilityArray.forEach(facility => {
            query = query.contains('facilities', [facility.trim()]);
          });
        }

        // Apply pagination
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: gyms, error, count } = await query;

        if (error) {
          logger.error('Error fetching gyms:', error);
          throw new APIError('Failed to fetch gyms', 500);
        }

        res.json({
          success: true,
          message: 'Gyms retrieved successfully',
          data: {
            gyms,
            total: count || gyms.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        });
      }

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/gyms/:gymId
 * @desc Get specific gym details
 * @access Private
 */
router.get('/:gymId',
  asyncHandler(async (req, res) => {
    const { gymId } = req.params;

    try {
      const { data: gym, error } = await supabase
        .from('gyms')
        .select(`
          *,
          memberships (
            id,
            user_id,
            plan_type,
            start_date,
            end_date,
            status
          ),
          gym_check_ins (
            id,
            user_id,
            check_in_time,
            check_out_time,
            status
          )
        `)
        .eq('id', gymId)
        .single();

      if (error || !gym) {
        throw new APIError('Gym not found', 404);
      }

      // Calculate additional statistics
      const stats = {
        total_members: gym.memberships?.filter(m => m.status === 'active').length || 0,
        active_check_ins: gym.gym_check_ins?.filter(c => c.status === 'active').length || 0,
        capacity_percentage: gym.capacity > 0 ? Math.round((gym.current_members / gym.capacity) * 100) : 0,
        average_rating: gym.rating || 0
      };

      res.json({
        success: true,
        message: 'Gym details retrieved successfully',
        data: {
          ...gym,
          stats
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/gyms/:gymId/members
 * @desc Get gym members (for gym owners/managers)
 * @access Private
 */
router.get('/:gymId/members',
  asyncHandler(async (req, res) => {
    const { gymId } = req.params;
    const { status = 'active', limit = 20, offset = 0 } = req.query;

    try {
      const { data: members, error } = await supabase
        .from('memberships')
        .select(`
          id,
          user_id,
          plan_type,
          start_date,
          end_date,
          status,
          created_at,
          users (
            id,
            full_name,
            email,
            phone_number,
            profile_picture_url
          )
        `)
        .eq('gym_id', gymId)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (error) {
        logger.error('Error fetching gym members:', error);
        throw new APIError('Failed to fetch gym members', 500);
      }

      res.json({
        success: true,
        message: 'Gym members retrieved successfully',
        data: {
          members,
          total: members.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/gyms/:gymId/check-ins
 * @desc Get gym check-ins (for gym owners/managers)
 * @access Private
 */
router.get('/:gymId/check-ins',
  asyncHandler(async (req, res) => {
    const { gymId } = req.params;
    const { date, status, limit = 20, offset = 0 } = req.query;

    try {
      let query = supabase
        .from('gym_check_ins')
        .select(`
          id,
          user_id,
          membership_id,
          check_in_time,
          check_out_time,
          duration_minutes,
          status,
          location_lat,
          location_lng,
          users (
            id,
            full_name,
            email,
            profile_picture_url
          ),
          memberships (
            id,
            plan_type
          )
        `)
        .eq('gym_id', gymId);

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte('check_in_time', startOfDay.toISOString())
          .lte('check_in_time', endOfDay.toISOString());
      }

      if (status) {
        query = query.eq('status', status);
      }

      query = query
        .order('check_in_time', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      const { data: checkIns, error } = await query;

      if (error) {
        logger.error('Error fetching gym check-ins:', error);
        throw new APIError('Failed to fetch gym check-ins', 500);
      }

      res.json({
        success: true,
        message: 'Gym check-ins retrieved successfully',
        data: {
          check_ins: checkIns,
          total: checkIns.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/gyms/:gymId/stats
 * @desc Get gym statistics
 * @access Private
 */
router.get('/:gymId/stats',
  asyncHandler(async (req, res) => {
    const { gymId } = req.params;
    const { period = '30d' } = req.query;

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get gym basic info
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('capacity, current_members, rating')
        .eq('id', gymId)
        .single();

      if (gymError || !gym) {
        throw new APIError('Gym not found', 404);
      }

      // Get check-ins for period
      const { data: checkIns, error: checkInError } = await supabase
        .from('gym_check_ins')
        .select('check_in_time, check_out_time, duration_minutes, status')
        .eq('gym_id', gymId)
        .gte('check_in_time', startDate.toISOString())
        .lte('check_in_time', endDate.toISOString());

      if (checkInError) {
        logger.error('Error fetching check-ins for stats:', checkInError);
      }

      // Get memberships for period
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('created_at, status, plan_type')
        .eq('gym_id', gymId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (membershipError) {
        logger.error('Error fetching memberships for stats:', membershipError);
      }

      // Calculate statistics
      const stats = {
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          days: Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
        },
        capacity: {
          total: gym.capacity,
          current: gym.current_members,
          percentage: gym.capacity > 0 ? Math.round((gym.current_members / gym.capacity) * 100) : 0
        },
        check_ins: {
          total: checkIns?.length || 0,
          active: checkIns?.filter(c => c.status === 'active').length || 0,
          completed: checkIns?.filter(c => c.status === 'completed').length || 0,
          total_duration: checkIns?.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) || 0,
          average_duration: checkIns?.length > 0 ? 
            Math.round(checkIns.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / checkIns.length) : 0
        },
        memberships: {
          total_new: memberships?.length || 0,
          active: memberships?.filter(m => m.status === 'active').length || 0,
          by_plan: memberships?.reduce((acc, m) => {
            acc[m.plan_type] = (acc[m.plan_type] || 0) + 1;
            return acc;
          }, {}) || {}
        },
        rating: gym.rating || 0
      };

      res.json({
        success: true,
        message: 'Gym statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/gyms/search
 * @desc Search gyms by name or location
 * @access Private
 */
router.get('/search',
  asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q) {
      throw new APIError('Search query is required', 400);
    }

    try {
      const { data: gyms, error } = await supabase
        .from('gyms')
        .select(`
          id,
          name,
          location,
          address,
          facilities,
          image_url,
          capacity,
          current_members,
          rating,
          location_lat,
          location_lng
        `)
        .or(`name.ilike.%${q}%,location.ilike.%${q}%,address.ilike.%${q}%`)
        .eq('status', 'active')
        .limit(parseInt(limit));

      if (error) {
        logger.error('Error searching gyms:', error);
        throw new APIError('Failed to search gyms', 500);
      }

      res.json({
        success: true,
        message: 'Gym search completed successfully',
        data: {
          query: q,
          results: gyms,
          total: gyms.length
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/gyms/popular
 * @desc Get popular gyms
 * @access Private
 */
router.get('/popular',
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    try {
      const { data: gyms, error } = await supabase
        .from('gyms')
        .select(`
          id,
          name,
          location,
          address,
          facilities,
          image_url,
          capacity,
          current_members,
          rating,
          location_lat,
          location_lng
        `)
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .order('current_members', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        logger.error('Error fetching popular gyms:', error);
        throw new APIError('Failed to fetch popular gyms', 500);
      }

      res.json({
        success: true,
        message: 'Popular gyms retrieved successfully',
        data: gyms
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/gyms/:gymId/review
 * @desc Submit a gym review
 * @access Private
 */
router.post('/:gymId/review',
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { gymId } = req.params;
    const { rating, comment } = req.body;

    try {
      // Check if user has already reviewed this gym
      const { data: existingReview, error: checkError } = await supabase
        .from('gym_reviews')
        .select('id')
        .eq('gym_id', gymId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        logger.error('Error checking existing review:', checkError);
        throw new APIError('Failed to check existing review', 500);
      }

      if (existingReview) {
        throw new APIError('You have already reviewed this gym', 400);
      }

      // Create review
      const { data: review, error } = await supabase
        .from('gym_reviews')
        .insert({
          gym_id: gymId,
          user_id: userId,
          rating,
          comment,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating gym review:', error);
        throw new APIError('Failed to create review', 500);
      }

      // Update gym average rating
      await updateGymRating(gymId);

      res.json({
        success: true,
        message: 'Gym review submitted successfully',
        data: review
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/gyms/:gymId/reviews
 * @desc Get gym reviews
 * @access Private
 */
router.get('/:gymId/reviews',
  asyncHandler(async (req, res) => {
    const { gymId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    try {
      const { data: reviews, error } = await supabase
        .from('gym_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          users (
            id,
            full_name,
            profile_picture_url
          )
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (error) {
        logger.error('Error fetching gym reviews:', error);
        throw new APIError('Failed to fetch gym reviews', 500);
      }

      res.json({
        success: true,
        message: 'Gym reviews retrieved successfully',
        data: {
          reviews,
          total: reviews.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

// Helper functions

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function updateGymRating(gymId) {
  try {
    // Get all reviews for the gym
    const { data: reviews, error } = await supabase
      .from('gym_reviews')
      .select('rating')
      .eq('gym_id', gymId);

    if (error) {
      logger.error('Error fetching reviews for rating update:', error);
      return;
    }

    if (reviews && reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

      // Update gym rating
      const { error: updateError } = await supabase
        .from('gyms')
        .update({
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          updated_at: new Date().toISOString()
        })
        .eq('id', gymId);

      if (updateError) {
        logger.error('Error updating gym rating:', updateError);
      }
    }

  } catch (error) {
    logger.error('Error in updateGymRating:', error);
  }
}

module.exports = router;