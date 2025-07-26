const express = require('express');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

const { logger } = require('../utils/logger');
const { asyncHandler, validationErrorHandler, APIError } = require('../middleware/errorHandler');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  } catch (error) {
    logger.error('Firebase Admin initialization error:', error);
  }
}

// Validation schemas
const sendNotificationValidation = [
  body('title').isString().notEmpty().withMessage('Title is required'),
  body('body').isString().notEmpty().withMessage('Body is required'),
  body('type').isIn(['workout_reminder', 'nutrition_reminder', 'achievement', 'general', 'promotional']).withMessage('Invalid notification type'),
  body('data').optional().isObject().withMessage('Data must be an object'),
  body('scheduled_at').optional().isISO8601().withMessage('Scheduled date must be a valid date')
];

/**
 * @route GET /api/notifications
 * @desc Get user's notifications
 * @access Private
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { 
      status = 'unread', 
      type, 
      limit = 20, 
      offset = 0 
    } = req.query;

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status === 'unread') {
        query = query.eq('read', false);
      } else if (status === 'read') {
        query = query.eq('read', true);
      }

      if (type) {
        query = query.eq('type', type);
      }

      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data: notifications, error } = await query;

      if (error) {
        logger.error('Error fetching notifications:', error);
        throw new APIError('Failed to fetch notifications', 500);
      }

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications,
          total: notifications.length,
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
 * @route GET /api/notifications/unread-count
 * @desc Get count of unread notifications
 * @access Private
 */
router.get('/unread-count',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        logger.error('Error counting unread notifications:', error);
        throw new APIError('Failed to count unread notifications', 500);
      }

      res.json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: {
          unread_count: count || 0
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:notificationId/read',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { notificationId } = req.params;

    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !notification) {
        throw new APIError('Notification not found', 404);
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        logger.error('Error marking all notifications as read:', error);
        throw new APIError('Failed to mark notifications as read', 500);
      }

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route DELETE /api/notifications/:notificationId
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:notificationId',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { notificationId } = req.params;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting notification:', error);
        throw new APIError('Failed to delete notification', 500);
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route GET /api/notifications/preferences
 * @desc Get user's notification preferences
 * @access Private
 */
router.get('/preferences',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new APIError('User not found', 404);
      }

      const defaultPreferences = {
        workout_reminders: true,
        nutrition_reminders: true,
        achievements: true,
        general: true,
        promotional: false,
        push_notifications: true,
        email_notifications: true,
        sms_notifications: false,
        quiet_hours: {
          enabled: false,
          start_time: '22:00',
          end_time: '08:00'
        }
      };

      res.json({
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: {
          ...defaultPreferences,
          ...user.notification_preferences
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route PUT /api/notifications/preferences
 * @desc Update user's notification preferences
 * @access Private
 */
router.put('/preferences',
  [
    body('workout_reminders').optional().isBoolean().withMessage('Workout reminders must be a boolean'),
    body('nutrition_reminders').optional().isBoolean().withMessage('Nutrition reminders must be a boolean'),
    body('achievements').optional().isBoolean().withMessage('Achievements must be a boolean'),
    body('general').optional().isBoolean().withMessage('General must be a boolean'),
    body('promotional').optional().isBoolean().withMessage('Promotional must be a boolean'),
    body('push_notifications').optional().isBoolean().withMessage('Push notifications must be a boolean'),
    body('email_notifications').optional().isBoolean().withMessage('Email notifications must be a boolean'),
    body('sms_notifications').optional().isBoolean().withMessage('SMS notifications must be a boolean'),
    body('quiet_hours').optional().isObject().withMessage('Quiet hours must be an object')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const preferences = req.body;

    try {
      // Get current preferences
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new APIError('User not found', 404);
      }

      // Merge with existing preferences
      const updatedPreferences = {
        ...user.notification_preferences,
        ...preferences
      };

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          notification_preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('notification_preferences')
        .single();

      if (error) {
        logger.error('Error updating notification preferences:', error);
        throw new APIError('Failed to update notification preferences', 500);
      }

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedUser.notification_preferences
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/notifications/send
 * @desc Send a notification to a user
 * @access Private
 */
router.post('/send',
  sendNotificationValidation,
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { title, body, type, data = {}, scheduled_at } = req.body;
    const userId = req.user.id;

    try {
      // Check user's notification preferences
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('notification_preferences, fcm_token')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new APIError('User not found', 404);
      }

      const preferences = user.notification_preferences || {};
      
      // Check if user has enabled this type of notification
      if (preferences[`${type}_notifications`] === false) {
        throw new APIError('User has disabled this type of notification', 400);
      }

      // Create notification record
      const notificationData = {
        user_id: userId,
        title,
        body,
        type,
        data,
        read: false,
        created_at: new Date().toISOString()
      };

      if (scheduled_at) {
        notificationData.scheduled_at = scheduled_at;
        notificationData.status = 'scheduled';
      } else {
        notificationData.status = 'sent';
      }

      const { data: notification, error: createError } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (createError) {
        logger.error('Error creating notification:', createError);
        throw new APIError('Failed to create notification', 500);
      }

      // Send push notification if enabled and FCM token exists
      if (preferences.push_notifications && user.fcm_token && !scheduled_at) {
        try {
          await sendPushNotification(user.fcm_token, title, body, data);
        } catch (pushError) {
          logger.error('Error sending push notification:', pushError);
          // Don't fail the request if push notification fails
        }
      }

      res.json({
        success: true,
        message: 'Notification sent successfully',
        data: notification
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/notifications/send-bulk
 * @desc Send notifications to multiple users
 * @access Private
 */
router.post('/send-bulk',
  [
    body('user_ids').isArray().withMessage('User IDs must be an array'),
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('body').isString().notEmpty().withMessage('Body is required'),
    body('type').isIn(['workout_reminder', 'nutrition_reminder', 'achievement', 'general', 'promotional']).withMessage('Invalid notification type'),
    body('data').optional().isObject().withMessage('Data must be an object')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { user_ids, title, body, type, data = {} } = req.body;

    try {
      // Get users with their notification preferences
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, notification_preferences, fcm_token')
        .in('id', user_ids);

      if (usersError) {
        logger.error('Error fetching users:', usersError);
        throw new APIError('Failed to fetch users', 500);
      }

      const notifications = [];
      const pushNotifications = [];

      // Create notifications for each user
      for (const user of users) {
        const preferences = user.notification_preferences || {};
        
        // Check if user has enabled this type of notification
        if (preferences[`${type}_notifications`] === false) {
          continue;
        }

        const notificationData = {
          user_id: user.id,
          title,
          body,
          type,
          data,
          read: false,
          status: 'sent',
          created_at: new Date().toISOString()
        };

        notifications.push(notificationData);

        // Prepare push notification if enabled
        if (preferences.push_notifications && user.fcm_token) {
          pushNotifications.push({
            token: user.fcm_token,
            title,
            body,
            data
          });
        }
      }

      // Insert notifications in batch
      if (notifications.length > 0) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) {
          logger.error('Error inserting bulk notifications:', insertError);
          throw new APIError('Failed to create notifications', 500);
        }
      }

      // Send push notifications
      if (pushNotifications.length > 0) {
        try {
          await sendBulkPushNotifications(pushNotifications);
        } catch (pushError) {
          logger.error('Error sending bulk push notifications:', pushError);
          // Don't fail the request if push notifications fail
        }
      }

      res.json({
        success: true,
        message: 'Bulk notifications sent successfully',
        data: {
          sent_count: notifications.length,
          push_notifications_sent: pushNotifications.length
        }
      });

    } catch (error) {
      throw error;
    }
  })
);

/**
 * @route POST /api/notifications/register-fcm
 * @desc Register FCM token for push notifications
 * @access Private
 */
router.post('/register-fcm',
  [
    body('fcm_token').isString().notEmpty().withMessage('FCM token is required')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { fcm_token } = req.body;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .update({
          fcm_token,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('fcm_token')
        .single();

      if (error) {
        logger.error('Error registering FCM token:', error);
        throw new APIError('Failed to register FCM token', 500);
      }

      res.json({
        success: true,
        message: 'FCM token registered successfully',
        data: { fcm_token: user.fcm_token }
      });

    } catch (error) {
      throw error;
    }
  })
);

// Helper functions

async function sendPushNotification(token, title, body, data = {}) {
  try {
    const message = {
      token,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        notification: {
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    logger.info('Push notification sent successfully:', response);
    return response;

  } catch (error) {
    logger.error('Error sending push notification:', error);
    throw error;
  }
}

async function sendBulkPushNotifications(notifications) {
  try {
    const messages = notifications.map(notification => ({
      token: notification.token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...notification.data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        notification: {
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    }));

    const response = await admin.messaging().sendAll(messages);
    logger.info('Bulk push notifications sent successfully:', response);
    return response;

  } catch (error) {
    logger.error('Error sending bulk push notifications:', error);
    throw error;
  }
}

module.exports = router;