const { supabase } = require('../utils/supabase');
const paymentService = require('../services/paymentService');
const smsService = require('../services/smsService');
// Logger simple pour éviter les imports circulaires
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
};

class PaymentController {
  /**
   * Get available membership plans
   */
  async getMembershipPlans(req, res) {
    try {
      const { data: plans, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_xof', { ascending: true });

      if (error) {
        logger.error('Get membership plans error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des plans'
        });
      }

      res.json({
        success: true,
        data: {
          plans
        }
      });

    } catch (error) {
      logger.error('Get membership plans error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Initiate payment for membership
   */
  async initiatePayment(req, res) {
    try {
      const userId = req.user.id;
      const { membershipPlanId, paymentMethod, phoneNumber } = req.body;

      // Get membership plan details
      const { data: plan, error: planError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('id', membershipPlanId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return res.status(404).json({
          success: false,
          error: 'Plan d\'abonnement non trouvé'
        });
      }

      // Check if user has pending payment for this plan
      const { data: existingPayment, error: paymentCheckError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('membership_plan_id', membershipPlanId)
        .eq('status', 'pending')
        .single();

      if (existingPayment) {
        return res.status(409).json({
          success: false,
          error: 'Un paiement est déjà en cours pour ce plan',
          data: {
            paymentId: existingPayment.id,
            transactionId: existingPayment.transaction_id
          }
        });
      }

      // Create payment record
      const paymentData = {
        user_id: userId,
        membership_plan_id: membershipPlanId,
        amount_xof: plan.price_xof,
        currency: 'XOF',
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        status: 'pending',
        plan_name: plan.name,
        plan_duration_days: plan.duration_days
      };

      const { data: payment, error: createError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (createError) {
        logger.error('Create payment error:', createError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création du paiement'
        });
      }

      // Initiate payment with DEXCHANGE
      const paymentResponse = await paymentService.initiatePayment({
        amount: plan.price_xof,
        currency: 'XOF',
        paymentMethod,
        phoneNumber,
        orderId: payment.id,
        description: `Abonnement ${plan.name} - Arcadis Fit`
      });

      if (!paymentResponse.success) {
        // Update payment status to failed
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            error_message: paymentResponse.error 
          })
          .eq('id', payment.id);

        return res.status(400).json({
          success: false,
          error: paymentResponse.error || 'Erreur lors de l\'initiation du paiement'
        });
      }

      // Update payment with transaction ID
      await supabase
        .from('payments')
        .update({ 
          transaction_id: paymentResponse.transactionId,
          dexchange_reference: paymentResponse.reference,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      logger.logPayment('payment_initiated', userId, plan.price_xof, paymentMethod, true);

      res.json({
        success: true,
        message: 'Paiement initié avec succès',
        data: {
          paymentId: payment.id,
          transactionId: paymentResponse.transactionId,
          reference: paymentResponse.reference,
          amount: plan.price_xof,
          currency: 'XOF',
          paymentMethod,
          instructions: paymentResponse.instructions
        }
      });

    } catch (error) {
      logger.error('Initiate payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      // Get payment from database
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', userId)
        .single();

      if (paymentError || !payment) {
        return res.status(404).json({
          success: false,
          error: 'Paiement non trouvé'
        });
      }

      // If payment is already completed or failed, return current status
      if (payment.status !== 'pending') {
        return res.json({
          success: true,
          data: {
            payment: {
              id: payment.id,
              status: payment.status,
              amount: payment.amount_xof,
              currency: payment.currency,
              paymentMethod: payment.payment_method,
              transactionId: payment.transaction_id,
              completedAt: payment.completed_at,
              errorMessage: payment.error_message
            }
          }
        });
      }

      // Check status with DEXCHANGE
      const statusResponse = await paymentService.checkPaymentStatus(
        payment.transaction_id || payment.dexchange_reference
      );

      if (!statusResponse.success) {
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la vérification du statut'
        });
      }

      // Update payment status if changed
      if (statusResponse.status !== payment.status) {
        const updates = {
          status: statusResponse.status,
          updated_at: new Date().toISOString()
        };

        if (statusResponse.status === 'completed') {
          updates.completed_at = new Date().toISOString();
          updates.dexchange_transaction_id = statusResponse.transactionId;
        } else if (statusResponse.status === 'failed') {
          updates.error_message = statusResponse.errorMessage;
        }

        await supabase
          .from('payments')
          .update(updates)
          .eq('id', payment.id);

        // If payment completed, create membership
        if (statusResponse.status === 'completed') {
          await this.createMembership(payment);
        }

        payment.status = statusResponse.status;
        payment.completed_at = updates.completed_at;
      }

      res.json({
        success: true,
        data: {
          payment: {
            id: payment.id,
            status: payment.status,
            amount: payment.amount_xof,
            currency: payment.currency,
            paymentMethod: payment.payment_method,
            transactionId: payment.transaction_id,
            completedAt: payment.completed_at,
            errorMessage: payment.error_message
          }
        }
      });

    } catch (error) {
      logger.error('Check payment status error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get user payment history
   */
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount_xof,
          currency,
          payment_method,
          status,
          plan_name,
          transaction_id,
          created_at,
          completed_at,
          membership_plans(name, duration_days)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Get payment history error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération de l\'historique'
        });
      }

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: payments.length === parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Webhook handler for DEXCHANGE payment notifications
   */
  async handleWebhook(req, res) {
    try {
      const webhookData = req.body;
      const signature = req.headers['x-dexchange-signature'];

      // Verify webhook signature
      if (!paymentService.verifyWebhookSignature(webhookData, signature)) {
        logger.warn('Invalid webhook signature', { 
          signature,
          ip: req.ip 
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid signature'
        });
      }

      const { orderId, status, transactionId, amount, errorMessage } = webhookData;

      // Find payment by order ID
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', orderId)
        .single();

      if (paymentError || !payment) {
        logger.warn('Payment not found for webhook', { orderId });
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      // Update payment status
      const updates = {
        status,
        dexchange_transaction_id: transactionId,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (status === 'failed') {
        updates.error_message = errorMessage;
      }

      await supabase
        .from('payments')
        .update(updates)
        .eq('id', payment.id);

      // Handle successful payment
      if (status === 'completed') {
        await this.createMembership(payment);
        
        // Send confirmation SMS
        await smsService.sendPaymentConfirmation(
          payment.phone_number,
          payment.amount_xof,
          payment.plan_name
        );

        logger.logPayment('payment_completed', payment.user_id, payment.amount_xof, payment.payment_method, true);
      } else if (status === 'failed') {
        logger.logPayment('payment_failed', payment.user_id, payment.amount_xof, payment.payment_method, false, errorMessage);
      }

      res.json({
        success: true,
        message: 'Webhook processed'
      });

    } catch (error) {
      logger.error('Webhook handler error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Refund a payment (admin only)
   */
  async refundPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        return res.status(404).json({
          success: false,
          error: 'Paiement non trouvé'
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Seuls les paiements complétés peuvent être remboursés'
        });
      }

      // Initiate refund with DEXCHANGE
      const refundResponse = await paymentService.initiateRefund({
        transactionId: payment.dexchange_transaction_id,
        amount: payment.amount_xof,
        reason
      });

      if (!refundResponse.success) {
        return res.status(400).json({
          success: false,
          error: refundResponse.error || 'Erreur lors du remboursement'
        });
      }

      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          refund_reason: reason,
          refund_reference: refundResponse.refundId,
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Deactivate associated membership
      await supabase
        .from('memberships')
        .update({
          status: 'cancelled',
          cancelled_reason: 'payment_refunded',
          cancelled_at: new Date().toISOString()
        })
        .eq('payment_id', payment.id);

      logger.logPayment('payment_refunded', payment.user_id, payment.amount_xof, payment.payment_method, true);

      res.json({
        success: true,
        message: 'Remboursement initié avec succès',
        data: {
          refundId: refundResponse.refundId
        }
      });

    } catch (error) {
      logger.error('Refund payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Get payment statistics (admin only)
   */
  async getPaymentStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      let query = supabase
        .from('payments')
        .select('amount_xof, status, payment_method, created_at');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: payments, error } = await query;

      if (error) {
        logger.error('Get payment stats error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des statistiques'
        });
      }

      // Calculate statistics
      const stats = {
        totalPayments: payments.length,
        totalAmount: 0,
        completedPayments: 0,
        completedAmount: 0,
        pendingPayments: 0,
        failedPayments: 0,
        refundedPayments: 0,
        paymentMethods: {
          wave: 0,
          orange_money: 0
        }
      };

      payments.forEach(payment => {
        stats.totalAmount += payment.amount_xof;
        
        if (payment.status === 'completed') {
          stats.completedPayments++;
          stats.completedAmount += payment.amount_xof;
        } else if (payment.status === 'pending') {
          stats.pendingPayments++;
        } else if (payment.status === 'failed') {
          stats.failedPayments++;
        } else if (payment.status === 'refunded') {
          stats.refundedPayments++;
        }

        if (payment.payment_method in stats.paymentMethods) {
          stats.paymentMethods[payment.payment_method]++;
        }
      });

      res.json({
        success: true,
        data: {
          stats,
          period: {
            startDate,
            endDate
          }
        }
      });

    } catch (error) {
      logger.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Create membership after successful payment
   */
  async createMembership(payment) {
    try {
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('id', payment.membership_plan_id)
        .single();

      if (planError || !plan) {
        logger.error('Plan not found for membership creation:', planError);
        return;
      }

      // Calculate expiration date
      const startDate = new Date();
      const expiresAt = new Date(startDate.getTime() + (plan.duration_days * 24 * 60 * 60 * 1000));

      // Create membership
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: payment.user_id,
          payment_id: payment.id,
          plan_id: payment.membership_plan_id,
          plan_name: plan.name,
          duration_days: plan.duration_days,
          start_date: startDate.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (membershipError) {
        logger.error('Membership creation error:', membershipError);
        return;
      }

      logger.info(`Membership created for user ${payment.user_id}: ${membership.id}`);
      
    } catch (error) {
      logger.error('Create membership error:', error);
    }
  }
}

module.exports = new PaymentController();