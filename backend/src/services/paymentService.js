const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.baseURL = process.env.DEXCHANGE_API_URL || 'https://api.dexchange.sn';
    this.apiKey = process.env.DEXCHANGE_API_KEY;
    this.secretKey = process.env.DEXCHANGE_SECRET_KEY;
    this.merchantId = process.env.DEXCHANGE_MERCHANT_ID;
    this.webhookSecret = process.env.DEXCHANGE_WEBHOOK_SECRET;
    
    if (!this.apiKey || !this.secretKey || !this.merchantId) {
      logger.warn('DEXCHANGE credentials not configured. Payment service will be disabled.');
    }
  }

  /**
   * Initiate payment with DEXCHANGE
   */
  async initiatePayment({
    amount,
    currency = 'XOF',
    paymentMethod,
    phoneNumber,
    orderId,
    description
  }) {
    try {
      if (!this.apiKey) {
        throw new Error('DEXCHANGE not configured');
      }

      // Format phone number for Senegal
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const paymentData = {
        merchant_id: this.merchantId,
        order_id: orderId,
        amount: amount,
        currency: currency,
        payment_method: paymentMethod, // 'wave' or 'orange_money'
        customer_phone: formattedPhone,
        description: description,
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        webhook_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        timestamp: Date.now()
      };

      // Generate signature
      const signature = this.generateSignature(paymentData);
      
      const response = await axios.post(`${this.baseURL}/v1/payments/initiate`, paymentData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Signature': signature
        },
        timeout: 30000
      });

      if (response.data.status === 'success') {
        logger.info(`Payment initiated successfully: ${orderId}`);
        
        return {
          success: true,
          transactionId: response.data.data.transaction_id,
          reference: response.data.data.reference,
          instructions: this.getPaymentInstructions(paymentMethod, formattedPhone, amount),
          redirectUrl: response.data.data.redirect_url
        };
      } else {
        logger.error('DEXCHANGE payment initiation failed:', response.data);
        return {
          success: false,
          error: response.data.message || 'Erreur lors de l\'initiation du paiement'
        };
      }

    } catch (error) {
      logger.error('Payment initiation error:', error);
      
      // In development, return mock success for testing
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using mock payment response in development');
        return {
          success: true,
          transactionId: `mock_${Date.now()}`,
          reference: `REF_${orderId}`,
          instructions: this.getPaymentInstructions(paymentMethod, phoneNumber, amount)
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur de communication avec le service de paiement'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId) {
    try {
      if (!this.apiKey) {
        throw new Error('DEXCHANGE not configured');
      }

      const requestData = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        timestamp: Date.now()
      };

      const signature = this.generateSignature(requestData);

      const response = await axios.get(
        `${this.baseURL}/v1/payments/status/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Signature': signature
          },
          timeout: 15000
        }
      );

      if (response.data.status === 'success') {
        const paymentData = response.data.data;
        
        return {
          success: true,
          status: this.mapDEXCHANGEStatus(paymentData.status),
          transactionId: paymentData.transaction_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          errorMessage: paymentData.error_message
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Erreur lors de la vérification du statut'
        };
      }

    } catch (error) {
      logger.error('Payment status check error:', error);
      
      // In development, return mock status for testing
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using mock payment status in development');
        return {
          success: true,
          status: 'completed', // or 'pending', 'failed'
          transactionId,
          amount: 0,
          currency: 'XOF'
        };
      }
      
      return {
        success: false,
        error: 'Erreur de communication avec le service de paiement'
      };
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund({ transactionId, amount, reason }) {
    try {
      if (!this.apiKey) {
        throw new Error('DEXCHANGE not configured');
      }

      const refundData = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        amount: amount,
        reason: reason,
        timestamp: Date.now()
      };

      const signature = this.generateSignature(refundData);

      const response = await axios.post(`${this.baseURL}/v1/payments/refund`, refundData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Signature': signature
        },
        timeout: 30000
      });

      if (response.data.status === 'success') {
        logger.info(`Refund initiated successfully: ${transactionId}`);
        
        return {
          success: true,
          refundId: response.data.data.refund_id,
          status: response.data.data.status
        };
      } else {
        logger.error('DEXCHANGE refund failed:', response.data);
        return {
          success: false,
          error: response.data.message || 'Erreur lors du remboursement'
        };
      }

    } catch (error) {
      logger.error('Refund initiation error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur de communication avec le service de paiement'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!this.webhookSecret) {
        logger.warn('Webhook secret not configured');
        return true; // Allow in development
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate signature for API requests
   */
  generateSignature(data) {
    try {
      if (!this.secretKey) {
        return 'mock_signature';
      }

      // Sort data keys alphabetically and create query string
      const sortedKeys = Object.keys(data).sort();
      const queryString = sortedKeys
        .map(key => `${key}=${data[key]}`)
        .join('&');

      // Generate HMAC SHA256 signature
      return crypto
        .createHmac('sha256', this.secretKey)
        .update(queryString)
        .digest('hex');
    } catch (error) {
      logger.error('Signature generation error:', error);
      return 'error_signature';
    }
  }

  /**
   * Format phone number for Senegal
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
    
    // If it's a local number (9 digits starting with 7 or 6)
    if (/^[76][0-9]{8}$/.test(cleaned)) {
      return '+221' + cleaned;
    }
    
    // If it starts with 0, remove it and add country code
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '+221' + cleaned.substring(1);
    }
    
    return phoneNumber; // Return as-is if can't format
  }

  /**
   * Map DEXCHANGE status to our internal status
   */
  mapDEXCHANGEStatus(dexchangeStatus) {
    const statusMap = {
      'PENDING': 'pending',
      'SUCCESS': 'completed',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'failed',
      'EXPIRED': 'failed',
      'REFUNDED': 'refunded'
    };

    return statusMap[dexchangeStatus] || 'pending';
  }

  /**
   * Get payment instructions for different methods
   */
  getPaymentInstructions(paymentMethod, phoneNumber, amount) {
    const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
    
    switch (paymentMethod) {
      case 'wave':
        return {
          title: 'Paiement Wave',
          steps: [
            'Ouvrez votre application Wave',
            `Composez *144*ARCADIS# ou envoyez "ARCADIS" au 144`,
            `Confirmez le paiement de ${formattedAmount} XOF`,
            'Saisissez votre code PIN Wave',
            'Vous recevrez un SMS de confirmation'
          ],
          note: 'Le paiement sera traité dans les 2-3 minutes'
        };
        
      case 'orange_money':
        return {
          title: 'Paiement Orange Money',
          steps: [
            'Composez #144*ARCADIS# depuis votre téléphone Orange',
            `Confirmez le paiement de ${formattedAmount} XOF`,
            'Saisissez votre code PIN Orange Money',
            'Validez la transaction',
            'Vous recevrez un SMS de confirmation'
          ],
          note: 'Le paiement sera traité dans les 2-3 minutes'
        };
        
      default:
        return {
          title: 'Instructions de paiement',
          steps: [
            'Suivez les instructions reçues par SMS',
            `Confirmez le paiement de ${formattedAmount} XOF`,
            'Saisissez votre code PIN',
            'Validez la transaction'
          ],
          note: 'Le paiement sera traité dans quelques minutes'
        };
    }
  }

  /**
   * Get payment method fees
   */
  getPaymentFees(paymentMethod, amount) {
    // DEXCHANGE fee structure (example - adjust based on actual rates)
    const feeStructures = {
      wave: {
        fixedFee: 0,
        percentageFee: 0.02, // 2%
        minFee: 0,
        maxFee: 1000
      },
      orange_money: {
        fixedFee: 0,
        percentageFee: 0.025, // 2.5%
        minFee: 0,
        maxFee: 1500
      }
    };

    const structure = feeStructures[paymentMethod];
    if (!structure) {
      return { fee: 0, totalAmount: amount };
    }

    let fee = structure.fixedFee + (amount * structure.percentageFee);
    fee = Math.max(fee, structure.minFee);
    fee = Math.min(fee, structure.maxFee);
    fee = Math.round(fee);

    return {
      fee,
      totalAmount: amount + fee,
      feeStructure: structure
    };
  }

  /**
   * Validate payment amount
   */
  validatePaymentAmount(amount, paymentMethod) {
    const limits = {
      wave: {
        min: 500,    // 500 XOF
        max: 2000000 // 2M XOF
      },
      orange_money: {
        min: 100,    // 100 XOF
        max: 1500000 // 1.5M XOF
      }
    };

    const limit = limits[paymentMethod];
    if (!limit) {
      return { valid: false, error: 'Méthode de paiement non supportée' };
    }

    if (amount < limit.min) {
      return { 
        valid: false, 
        error: `Montant minimum: ${limit.min} XOF` 
      };
    }

    if (amount > limit.max) {
      return { 
        valid: false, 
        error: `Montant maximum: ${limit.max} XOF` 
      };
    }

    return { valid: true };
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      {
        id: 'wave',
        name: 'Wave',
        displayName: 'Wave Mobile Money',
        icon: '/icons/wave.png',
        description: 'Paiement rapide et sécurisé avec Wave',
        fees: 'Frais: 2%',
        minAmount: 500,
        maxAmount: 2000000,
        available: true
      },
      {
        id: 'orange_money',
        name: 'Orange Money',
        displayName: 'Orange Money Sénégal',
        icon: '/icons/orange-money.png',
        description: 'Paiement avec votre compte Orange Money',
        fees: 'Frais: 2.5%',
        minAmount: 100,
        maxAmount: 1500000,
        available: true
      }
    ];
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount, currency = 'XOF') {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get transaction receipt data
   */
  async getTransactionReceipt(transactionId) {
    try {
      const statusResponse = await this.checkPaymentStatus(transactionId);
      
      if (!statusResponse.success) {
        throw new Error('Transaction not found');
      }

      return {
        transactionId,
        status: statusResponse.status,
        amount: this.formatCurrency(statusResponse.amount),
        currency: statusResponse.currency,
        timestamp: new Date().toISOString(),
        reference: `ARC-${transactionId.slice(-8).toUpperCase()}`
      };
    } catch (error) {
      logger.error('Get transaction receipt error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();