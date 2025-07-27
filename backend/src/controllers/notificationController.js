// Contrôleur pour la gestion des notifications
const supabase = require('../utils/supabase');

// Logger simple pour éviter les imports circulaires
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};

/**
 * Obtenir les notifications d'un utilisateur
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      limit = 20, 
      offset = 0,
      unread_only = false,
      type 
    } = req.query;

    logger.info(`Getting notifications for user ${userId}`);

    let query = supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        data,
        is_read,
        created_at,
        expires_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filtres optionnels
    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }
    
    if (type) {
      query = query.eq('type', type);
    }

    // Pagination
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: notifications, error } = await query;

    if (error) {
      logger.error('Get notifications error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des notifications'
      });
    }

    // Compter les non-lues
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (countError) {
      logger.warn('Could not count unread notifications:', countError);
    }

    res.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount || 0,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: notifications.length
        }
      }
    });

  } catch (error) {
    logger.error('Get notifications exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des notifications'
    });
  }
};

/**
 * Marquer une notification comme lue
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    logger.info(`Marking notification ${notificationId} as read for user ${userId}`);

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Mark notification as read error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de la notification'
      });
    }

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Notification marquée comme lue',
      data: notification
    });

  } catch (error) {
    logger.error('Mark notification as read exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour'
    });
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Marking all notifications as read for user ${userId}`);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) {
      logger.error('Mark all notifications as read error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des notifications'
      });
    }

    res.json({
      success: true,
      message: `${notifications.length} notifications marquées comme lues`,
      data: {
        updated_count: notifications.length
      }
    });

  } catch (error) {
    logger.error('Mark all notifications as read exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour'
    });
  }
};

/**
 * Supprimer une notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    logger.info(`Deleting notification ${notificationId} for user ${userId}`);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Delete notification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de la notification'
      });
    }

    res.json({
      success: true,
      message: 'Notification supprimée avec succès'
    });

  } catch (error) {
    logger.error('Delete notification exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression'
    });
  }
};

/**
 * Obtenir les préférences de notification d'un utilisateur
 */
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Getting notification preferences for user ${userId}`);

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('notifications')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Si pas de préférences, retourner les valeurs par défaut
      if (error.code === 'PGRST116') {
        const defaultPreferences = {
          email: {
            workout_reminders: true,
            payment_confirmations: true,
            membership_expiry: true,
            promotional: false,
            weekly_summary: true
          },
          push: {
            workout_reminders: true,
            check_in_reminders: true,
            goal_achievements: true,
            social_interactions: false
          },
          sms: {
            payment_confirmations: true,
            emergency_notifications: true,
            membership_expiry: true
          }
        };

        return res.json({
          success: true,
          data: defaultPreferences
        });
      }

      logger.error('Get notification preferences error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des préférences'
      });
    }

    res.json({
      success: true,
      data: preferences.notifications || {}
    });

  } catch (error) {
    logger.error('Get notification preferences exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération'
    });
  }
};

/**
 * Mettre à jour les préférences de notification
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications } = req.body;

    logger.info(`Updating notification preferences for user ${userId}`);

    // Vérifier si les préférences existent
    const { data: existingPreferences, error: checkError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (checkError && checkError.code === 'PGRST116') {
      // Créer les préférences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          notifications
        })
        .select()
        .single();

      result = { data, error };
    } else {
      // Mettre à jour les préférences existantes
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ notifications })
        .eq('user_id', userId)
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      logger.error('Update notification preferences error:', result.error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des préférences'
      });
    }

    res.json({
      success: true,
      message: 'Préférences de notification mises à jour',
      data: result.data.notifications
    });

  } catch (error) {
    logger.error('Update notification preferences exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour'
    });
  }
};

/**
 * Créer une nouvelle notification (pour usage interne)
 */
const createNotification = async (req, res) => {
  try {
    const {
      user_id,
      title,
      message,
      type,
      data,
      expires_at
    } = req.body;

    logger.info(`Creating notification for user ${user_id}: ${title}`);

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        data: data || {},
        expires_at,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      logger.error('Create notification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la notification'
      });
    }

    // TODO: Envoyer la notification push/email/SMS selon les préférences
    await sendNotificationByPreferences(user_id, notification);

    res.json({
      success: true,
      message: 'Notification créée avec succès',
      data: notification
    });

  } catch (error) {
    logger.error('Create notification exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création'
    });
  }
};

/**
 * Obtenir les statistiques des notifications
 */
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Getting notification stats for user ${userId}`);

    // Compter par type
    const { data: typeStats, error: typeError } = await supabase
      .from('notifications')
      .select('type')
      .eq('user_id', userId);

    if (typeError) {
      logger.error('Get notification type stats error:', typeError);
    }

    // Compter les lues/non lues
    const { count: totalCount, error: totalError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    const stats = {
      total: totalCount || 0,
      unread: unreadCount || 0,
      read: (totalCount || 0) - (unreadCount || 0),
      by_type: {}
    };

    // Calculer les stats par type
    if (typeStats) {
      stats.by_type = typeStats.reduce((acc, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      }, {});
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Get notification stats exception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du calcul des statistiques'
    });
  }
};

// Fonctions utilitaires

/**
 * Envoyer une notification selon les préférences utilisateur
 */
async function sendNotificationByPreferences(userId, notification) {
  try {
    // Récupérer les préférences de l'utilisateur
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('notifications')
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.warn('Could not get user preferences for notification sending');
      return;
    }

    const notifPrefs = preferences.notifications || {};

    // Envoyer selon les préférences
    // TODO: Implémenter l'envoi réel
    logger.info(`Would send notification via configured channels for user ${userId}`);

    // Exemple de logique:
    // if (notifPrefs.push && shouldSendPush(notification.type)) {
    //   await sendPushNotification(userId, notification);
    // }
    // if (notifPrefs.email && shouldSendEmail(notification.type)) {
    //   await sendEmailNotification(userId, notification);
    // }
    // if (notifPrefs.sms && shouldSendSMS(notification.type)) {
    //   await sendSMSNotification(userId, notification);
    // }

  } catch (error) {
    logger.error('Error sending notification by preferences:', error);
  }
}

/**
 * Créer des notifications de rappel pour les entraînements
 */
async function createWorkoutReminders() {
  try {
    logger.info('Creating workout reminders');

    // TODO: Logique pour créer des rappels d'entraînement
    // Chercher les utilisateurs avec des séances programmées
    // Créer des notifications de rappel

  } catch (error) {
    logger.error('Error creating workout reminders:', error);
  }
}

/**
 * Nettoyer les notifications expirées
 */
async function cleanupExpiredNotifications() {
  try {
    logger.info('Cleaning up expired notifications');

    const { data: deleted, error } = await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (!error) {
      logger.info(`Deleted ${deleted.length} expired notifications`);
    }

  } catch (error) {
    logger.error('Error cleaning up expired notifications:', error);
  }
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotification,
  getNotificationStats,
  
  // Fonctions utilitaires pour usage interne
  sendNotificationByPreferences,
  createWorkoutReminders,
  cleanupExpiredNotifications
};