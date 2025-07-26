const express = require('express');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const { logger } = require('../utils/logger');
const { asyncHandler, validationErrorHandler, APIError } = require('../middleware/errorHandler');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation schemas
const createMembershipValidation = [
  body('gym_id').isUUID().withMessage('Valid gym ID is required'),
  body('plan_type').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid plan type'),
  body('start_date').isISO8601().withMessage('Start date must be a valid date'),
  body('end_date').isISO8601().withMessage('End date must be a valid date')
];

/**
 * @route POST /api/memberships
 * @desc Create a new gym membership
 * @access Private
 */
router.post('/',
  createMembershipValidation,
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { gym_id, plan_type, start_date, end_date, payment_id } = req.body;

    try {
      // Check if user already has an active membership at this gym
      const { data: existingMembership, error: checkError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('gym_id', gym_id)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new APIError('Failed to check existing membership', 500);
      }

      if (existingMembership) {
        throw new APIError('User already has an active membership at this gym', 400);
      }

      // Get gym information
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gym_id)
        .single();

      if (gymError || !gym) {
        throw new APIError('Gym not found', 404);
      }

      // Generate QR code for membership card
      const membershipData = {
        user_id: userId,
        gym_id: gym_id,
        membership_id: null, // Will be set after creation
        timestamp: new Date().toISOString()
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(membershipData));

      // Create membership
      const { data: membership, error: createError } = await supabase
        .from('memberships')
        .insert({
          user_id: userId,
          gym_id: gym_id,
          plan_type: plan_type,
          start_date: start_date,
          end_date: end_date,
          status: 'active',
          payment_id: payment_id,
          qr_code_data: membershipData,
          qr_code_image: qrCodeDataUrl,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError || !membership) {
        logger.error('Error creating membership:', createError);
        throw new APIError('Failed to create membership', 500);
      }

      // Update QR code with actual membership ID
      membershipData.membership_id = membership.id;
      const updatedQrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(membershipData));

      // Update membership with final QR code
      const { error: updateError } = await supabase
        .from('memberships')
        .update({
          qr_code_data: membershipData,
          qr_code_image: updatedQrCodeDataUrl
        })
        .eq('id', membership.id);

      if (updateError) {
        logger.error('Error updating membership QR code:', updateError);
      }

      res.json({
        success: true,
        message: 'Membership created successfully',
        data: {
          ...membership,
          qr_code_image: updatedQrCodeDataUrl
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/memberships
 * @desc Get user's memberships
 * @access Private
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    try {
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          *,
          gyms (
            id,
            name,
            location,
            address,
            phone,
            email,
            operating_hours,
            facilities,
            image_url
          ),
          payments (
            id,
            amount,
            currency,
            status,
            payment_method
          )
        `)
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching memberships:', error);
        throw new APIError('Failed to fetch memberships', 500);
      }

      res.json({
        success: true,
        message: 'Memberships retrieved successfully',
        data: memberships
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/memberships/:membershipId
 * @desc Get specific membership details
 * @access Private
 */
router.get('/:membershipId',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { membershipId } = req.params;

    try {
      const { data: membership, error } = await supabase
        .from('memberships')
        .select(`
          *,
          gyms (
            id,
            name,
            location,
            address,
            phone,
            email,
            operating_hours,
            facilities,
            image_url,
            capacity,
            current_members
          ),
          payments (
            id,
            amount,
            currency,
            status,
            payment_method,
            transaction_id,
            created_at
          )
        `)
        .eq('id', membershipId)
        .eq('user_id', userId)
        .single();

      if (error || !membership) {
        throw new APIError('Membership not found', 404);
      }

      res.json({
        success: true,
        message: 'Membership details retrieved successfully',
        data: membership
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/memberships/:membershipId/qr-code
 * @desc Get membership QR code
 * @access Private
 */
router.get('/:membershipId/qr-code',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { membershipId } = req.params;

    try {
      const { data: membership, error } = await supabase
        .from('memberships')
        .select('qr_code_image, qr_code_data, status')
        .eq('id', membershipId)
        .eq('user_id', userId)
        .single();

      if (error || !membership) {
        throw new APIError('Membership not found', 404);
      }

      if (membership.status !== 'active') {
        throw new APIError('Membership is not active', 400);
      }

      res.json({
        success: true,
        message: 'QR code retrieved successfully',
        data: {
          qr_code_image: membership.qr_code_image,
          qr_code_data: membership.qr_code_data
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/memberships/:membershipId/check-in
 * @desc Check in to gym using membership
 * @access Private
 */
router.post('/:membershipId/check-in',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { membershipId } = req.params;
    const { location_lat, location_lng } = req.body;

    try {
      // Get membership details
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          *,
          gyms (
            id,
            name,
            location,
            address,
            location_lat,
            location_lng
          )
        `)
        .eq('id', membershipId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        throw new APIError('Membership not found', 404);
      }

      if (membership.status !== 'active') {
        throw new APIError('Membership is not active', 400);
      }

      // Check if membership is expired
      if (new Date() > new Date(membership.end_date)) {
        throw new APIError('Membership has expired', 400);
      }

      // Verify location proximity (optional)
      if (location_lat && location_lng && membership.gyms.location_lat && membership.gyms.location_lng) {
        const distance = calculateDistance(
          location_lat,
          location_lng,
          membership.gyms.location_lat,
          membership.gyms.location_lng
        );

        if (distance > 0.5) { // 500 meters radius
          throw new APIError('You must be within 500 meters of the gym to check in', 400);
        }
      }

      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingCheckIn, error: checkInError } = await supabase
        .from('gym_check_ins')
        .select('*')
        .eq('membership_id', membershipId)
        .eq('user_id', userId)
        .gte('check_in_time', today)
        .single();

      if (checkInError && checkInError.code !== 'PGRST116') {
        logger.error('Error checking existing check-in:', checkInError);
        throw new APIError('Failed to verify check-in status', 500);
      }

      if (existingCheckIn) {
        throw new APIError('Already checked in today', 400);
      }

      // Create check-in record
      const { data: checkIn, error: createError } = await supabase
        .from('gym_check_ins')
        .insert({
          membership_id: membershipId,
          user_id: userId,
          gym_id: membership.gym_id,
          check_in_time: new Date().toISOString(),
          location_lat: location_lat,
          location_lng: location_lng,
          status: 'active'
        })
        .select()
        .single();

      if (createError || !checkIn) {
        logger.error('Error creating check-in:', createError);
        throw new APIError('Failed to check in', 500);
      }

      // Update gym capacity
      await updateGymCapacity(membership.gym_id, 1);

      res.json({
        success: true,
        message: 'Successfully checked in to gym',
        data: {
          check_in: checkIn,
          gym: membership.gyms,
          membership: {
            id: membership.id,
            plan_type: membership.plan_type,
            end_date: membership.end_date
          }
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/memberships/:membershipId/check-out
 * @desc Check out from gym
 * @access Private
 */
router.post('/:membershipId/check-out',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { membershipId } = req.params;

    try {
      // Find active check-in for today
      const today = new Date().toISOString().split('T')[0];
      const { data: checkIn, error: checkInError } = await supabase
        .from('gym_check_ins')
        .select('*')
        .eq('membership_id', membershipId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('check_in_time', today)
        .single();

      if (checkInError || !checkIn) {
        throw new APIError('No active check-in found for today', 400);
      }

      // Update check-in with check-out time
      const { data: updatedCheckIn, error: updateError } = await supabase
        .from('gym_check_ins')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'completed',
          duration_minutes: Math.round((new Date() - new Date(checkIn.check_in_time)) / (1000 * 60))
        })
        .eq('id', checkIn.id)
        .select()
        .single();

      if (updateError || !updatedCheckIn) {
        logger.error('Error updating check-out:', updateError);
        throw new APIError('Failed to check out', 500);
      }

      // Update gym capacity
      await updateGymCapacity(checkIn.gym_id, -1);

      res.json({
        success: true,
        message: 'Successfully checked out from gym',
        data: updatedCheckIn
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/memberships/:membershipId/check-ins
 * @desc Get membership check-in history
 * @access Private
 */
router.get('/:membershipId/check-ins',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { membershipId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    try {
      const { data: checkIns, error } = await supabase
        .from('gym_check_ins')
        .select(`
          *,
          gyms (
            id,
            name,
            location
          )
        `)
        .eq('membership_id', membershipId)
        .eq('user_id', userId)
        .order('check_in_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error fetching check-ins:', error);
        throw new APIError('Failed to fetch check-in history', 500);
      }

      res.json({
        success: true,
        message: 'Check-in history retrieved successfully',
        data: checkIns
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/memberships/:membershipId/cancel
 * @desc Cancel membership
 * @access Private
 */
router.put('/:membershipId/cancel',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { membershipId } = req.params;

    try {
      const { data: membership, error } = await supabase
        .from('memberships')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', membershipId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !membership) {
        throw new APIError('Membership not found', 404);
      }

      res.json({
        success: true,
        message: 'Membership cancelled successfully',
        data: membership
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/memberships/nearby-gyms
 * @desc Get nearby gyms for membership
 * @access Private
 */
router.get('/nearby-gyms',
  asyncHandler(async (req, res) => {
    const { lat, lng, radius = 10 } = req.query; // radius in km

    try {
      let query = supabase
        .from('gyms')
        .select(`
          id,
          name,
          location,
          address,
          phone,
          email,
          operating_hours,
          facilities,
          image_url,
          capacity,
          current_members,
          location_lat,
          location_lng,
          rating,
          membership_plans
        `)
        .eq('status', 'active');

      // If coordinates provided, filter by distance
      if (lat && lng) {
        // This is a simplified distance calculation
        // In production, you might want to use PostGIS or similar
        const { data: gyms, error } = await query;

        if (error) {
          logger.error('Error fetching gyms:', error);
          throw new APIError('Failed to fetch nearby gyms', 500);
        }

        // Filter by distance
        const nearbyGyms = gyms.filter(gym => {
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

        res.json({
          success: true,
          message: 'Nearby gyms retrieved successfully',
          data: nearbyGyms
        });
      } else {
        // Return all active gyms if no coordinates provided
        const { data: gyms, error } = await query;

        if (error) {
          logger.error('Error fetching gyms:', error);
          throw new APIError('Failed to fetch gyms', 500);
        }

        res.json({
          success: true,
          message: 'Gyms retrieved successfully',
          data: gyms
        });
      }

    } catch (error) {
      throw error;
    }
  })
);

// Helper function to calculate distance between two points
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

// Helper function to update gym capacity
async function updateGymCapacity(gymId, change) {
  try {
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('current_members, capacity')
      .eq('id', gymId)
      .single();

    if (gymError) {
      logger.error('Error fetching gym capacity:', gymError);
      return;
    }

    const newCurrentMembers = Math.max(0, Math.min(gym.capacity, (gym.current_members || 0) + change));

    const { error: updateError } = await supabase
      .from('gyms')
      .update({
        current_members: newCurrentMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', gymId);

    if (updateError) {
      logger.error('Error updating gym capacity:', updateError);
    }

  } catch (error) {
    logger.error('Error in updateGymCapacity:', error);
  }
}

module.exports = router;