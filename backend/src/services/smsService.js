const twilio = require('twilio');
// Logger simple pour éviter les imports circulaires
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};
const authService = require('./authService');

class SMSService {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.init();
  }

  /**
   * Initialize Twilio client
   */
  init() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (!accountSid || !authToken) {
        logger.warn('Twilio credentials not found. SMS service will be disabled.');
        return;
      }

      this.client = twilio(accountSid, authToken);
      this.initialized = true;
      
      logger.info('SMS Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SMS service:', error);
    }
  }

  /**
   * Send verification code to phone number
   */
  async sendVerificationCode(phoneNumber) {
    try {
      if (!this.initialized) {
        throw new Error('SMS service not initialized');
      }

      // Generate 6-digit verification code
      const code = authService.generateVerificationCode();
      
      // Format message in French for Senegal
      const message = `Arcadis Fit: Votre code de vérification est ${code}. Ce code expire dans 10 minutes. Ne le partagez jamais.`;

      // Send SMS
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      logger.info(`SMS sent successfully to ${phoneNumber}. MessageSid: ${result.sid}`);
      
      return code;
    } catch (error) {
      logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      
      // In development/testing, return a test code
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        logger.warn('Using test verification code in development mode');
        return '123456';
      }
      
      throw new Error('Erreur lors de l\'envoi du SMS');
    }
  }

  /**
   * Send welcome SMS after successful registration
   */
  async sendWelcomeSMS(phoneNumber, fullName) {
    try {
      if (!this.initialized) {
        logger.warn('SMS service not initialized, skipping welcome SMS');
        return;
      }

      const message = `Bienvenue chez Arcadis Fit ${fullName}! 🏋️ Votre compte a été créé avec succès. Prêt à commencer votre parcours fitness au Sénégal?`;

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      logger.info(`Welcome SMS sent to ${phoneNumber}. MessageSid: ${result.sid}`);
      
      return result.sid;
    } catch (error) {
      logger.error(`Failed to send welcome SMS to ${phoneNumber}:`, error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(phoneNumber, amount, membershipType) {
    try {
      if (!this.initialized) {
        logger.warn('SMS service not initialized, skipping payment SMS');
        return;
      }

      const message = `Arcadis Fit: Paiement confirmé! 💰 ${amount} XOF pour votre abonnement ${membershipType}. Merci pour votre confiance!`;

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      logger.info(`Payment confirmation SMS sent to ${phoneNumber}. MessageSid: ${result.sid}`);
      
      return result.sid;
    } catch (error) {
      logger.error(`Failed to send payment confirmation SMS to ${phoneNumber}:`, error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Send membership expiration reminder
   */
  async sendMembershipReminder(phoneNumber, daysLeft) {
    try {
      if (!this.initialized) {
        logger.warn('SMS service not initialized, skipping reminder SMS');
        return;
      }

      let message;
      if (daysLeft <= 0) {
        message = `Arcadis Fit: Votre abonnement a expiré. Renouvelez maintenant pour continuer à profiter de nos services! 🏋️`;
      } else if (daysLeft <= 3) {
        message = `Arcadis Fit: Votre abonnement expire dans ${daysLeft} jour(s). Renouvelez maintenant pour éviter toute interruption! ⏰`;
      } else {
        message = `Arcadis Fit: Rappel - Votre abonnement expire dans ${daysLeft} jours. Pensez à le renouveler! 📅`;
      }

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      logger.info(`Membership reminder SMS sent to ${phoneNumber}. MessageSid: ${result.sid}`);
      
      return result.sid;
    } catch (error) {
      logger.error(`Failed to send membership reminder SMS to ${phoneNumber}:`, error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Send workout reminder
   */
  async sendWorkoutReminder(phoneNumber, workoutType) {
    try {
      if (!this.initialized) {
        logger.warn('SMS service not initialized, skipping workout reminder');
        return;
      }

      const message = `Arcadis Fit: C'est l'heure de votre séance ${workoutType}! 💪 Votre corps vous remerciera. Allez-y champion!`;

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      logger.info(`Workout reminder SMS sent to ${phoneNumber}. MessageSid: ${result.sid}`);
      
      return result.sid;
    } catch (error) {
      logger.error(`Failed to send workout reminder SMS to ${phoneNumber}:`, error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Send QR code for gym access
   */
  async sendGymQRCode(phoneNumber, qrCodeUrl, gymName) {
    try {
      if (!this.initialized) {
        logger.warn('SMS service not initialized, skipping QR code SMS');
        return;
      }

      const message = `Arcadis Fit: Votre QR code pour ${gymName} est prêt! Accédez à votre code ici: ${qrCodeUrl} Bonne séance! 🏋️‍♂️`;

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      logger.info(`QR code SMS sent to ${phoneNumber}. MessageSid: ${result.sid}`);
      
      return result.sid;
    } catch (error) {
      logger.error(`Failed to send QR code SMS to ${phoneNumber}:`, error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Validate Senegalese phone number
   */
  validateSenegalPhoneNumber(phoneNumber) {
    // Senegalese phone numbers: +221 followed by 9 digits
    // Mobile numbers start with 7 (77, 78, 76, 75, 70)
    const senegalPattern = /^\+221[76][0-9]{7}$/;
    
    // Also accept format without country code for local numbers
    const localPattern = /^[76][0-9]{7}$/;
    
    return senegalPattern.test(phoneNumber) || localPattern.test(phoneNumber);
  }

  /**
   * Format phone number to international format
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it starts with +221, it's already formatted
    if (cleaned.startsWith('+221')) {
      return cleaned;
    }
    
    // If it starts with 221, add the +
    if (cleaned.startsWith('221')) {
      return '+' + cleaned;
    }
    
    // If it's a local number (8 digits starting with 7 or 6)
    if (/^[76][0-9]{7}$/.test(cleaned)) {
      return '+221' + cleaned;
    }
    
    // If it starts with 0, remove it and add country code
    if (cleaned.startsWith('0') && cleaned.length === 9) {
      return '+221' + cleaned.substring(1);
    }
    
    return phoneNumber; // Return as-is if can't format
  }

  /**
   * Check SMS delivery status
   */
  async checkDeliveryStatus(messageSid) {
    try {
      if (!this.initialized) {
        throw new Error('SMS service not initialized');
      }

      const message = await this.client.messages(messageSid).fetch();
      
      return {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };
    } catch (error) {
      logger.error(`Failed to check delivery status for ${messageSid}:`, error);
      throw error;
    }
  }

  /**
   * Get SMS usage statistics
   */
  async getUsageStats(startDate, endDate) {
    try {
      if (!this.initialized) {
        throw new Error('SMS service not initialized');
      }

      const messages = await this.client.messages.list({
        dateSentAfter: startDate,
        dateSentBefore: endDate,
        from: process.env.TWILIO_PHONE_NUMBER
      });

      const stats = {
        totalSent: messages.length,
        delivered: 0,
        failed: 0,
        pending: 0,
        totalCost: 0
      };

      messages.forEach(message => {
        switch (message.status) {
          case 'delivered':
            stats.delivered++;
            break;
          case 'failed':
          case 'undelivered':
            stats.failed++;
            break;
          case 'sent':
          case 'queued':
          case 'accepted':
            stats.pending++;
            break;
        }
        
        if (message.price) {
          stats.totalCost += Math.abs(parseFloat(message.price));
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get SMS usage stats:', error);
      throw error;
    }
  }

  /**
   * Blacklist/unsubscribe management
   */
  async isPhoneBlacklisted(phoneNumber) {
    // This would typically check against a database of unsubscribed numbers
    // For now, return false (no blacklist)
    return false;
  }

  /**
   * Add phone number to blacklist
   */
  async addToBlacklist(phoneNumber, reason) {
    try {
      // Here you would add the phone number to your blacklist database
      logger.info(`Phone number ${phoneNumber} added to blacklist. Reason: ${reason}`);
      
      // You might also want to notify Twilio or update your contact list
      return true;
    } catch (error) {
      logger.error(`Failed to add ${phoneNumber} to blacklist:`, error);
      return false;
    }
  }

  /**
   * Send bulk SMS (for marketing/notifications)
   */
  async sendBulkSMS(phoneNumbers, message, options = {}) {
    try {
      if (!this.initialized) {
        throw new Error('SMS service not initialized');
      }

      const results = [];
      const batchSize = options.batchSize || 10;
      const delay = options.delay || 1000; // 1 second delay between batches

      for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const batch = phoneNumbers.slice(i, i + batchSize);
        const batchPromises = batch.map(async (phoneNumber) => {
          try {
            // Check if phone is blacklisted
            if (await this.isPhoneBlacklisted(phoneNumber)) {
              return { phoneNumber, status: 'skipped', reason: 'blacklisted' };
            }

            const result = await this.client.messages.create({
              body: message,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: phoneNumber
            });

            return { phoneNumber, status: 'sent', messageSid: result.sid };
          } catch (error) {
            return { phoneNumber, status: 'failed', error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Delay between batches to avoid rate limiting
        if (i + batchSize < phoneNumbers.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      logger.info(`Bulk SMS completed. Sent to ${results.filter(r => r.status === 'sent').length}/${phoneNumbers.length} recipients`);
      
      return results;
    } catch (error) {
      logger.error('Failed to send bulk SMS:', error);
      throw error;
    }
  }
}

module.exports = new SMSService();