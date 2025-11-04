import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'
import Plan from '#models/plan'
import { createValidator } from '#validators/plan';
import { DateTime } from 'luxon';
import PlanSubscriber from '#models/plan_subcriber';
import Wallet from '#models/wallet';
import PlanType from '#models/plan_type';
import User from '#models/user';
import NotificationService from '#services/notificationService';
import WalletTransaction from '#models/wallet_transaction';
import hash from '@adonisjs/core/services/hash';
import GenerateTokenHelper from '#services/generateToken';
import UserCard from '#models/user_card';
import PlanTransaction from '#models/plans_transaction';
export default class PlansController {

  private paystackService: PaystackService
  private notificationService: NotificationService
  constructor() {
    this.paystackService = new PaystackService()
    this.notificationService = new NotificationService()
  }
  /**
   * @index
   * @description Get all created plans
   * @responseBody 200 - {"message": "Plan fetch successfully", "data": [{"id": 1, "name": "My Savings Plan", "amount": 5000}]}
   */
  async index({ response }: HttpContext) {
    const userPlans = await Plan.all()
    return response.status(200).json({
      message: 'Plan fetch successfully',
      data: userPlans
    });
  }

  /**
   * @getPlanType
   * @description Get all available plan types
   * @responseBody 200 - {"message": "Plan type fetch successfully", "data": [{"id": 1, "name": "Fixed Savings", "interestRate": 10}]}
   */
  async getPlanType({ response }: HttpContext) {
    const planTypes = await PlanType.all()
    // console.log(planTypes)
    return response.status(200).json({
      message: 'Plan type fetch successfully',
      data: planTypes
    })
  }

  /**
   * @create
   * @description Create new savings plan
   * @requestBody {"name": "My Savings Plan", "description": "Monthly savings", "amount": 10000, "plan_id": 1, "target_amount": 50000, "interval": "MONTHLY", "interest": 10, "start_date": "2024-03-04", "end_date": "2025-03-04"}
   * @responseBody 201 - {"message": "Plan created successfully"}
   * @responseBody 403 - {"message": "No Debit card found, Create a Card to continue"}
   */

  async create({ auth, request, response }: HttpContext) {
    const user = auth.user!;
    const { ...payload } = await request.validateUsing(createValidator);
    const referenceCode = GenerateTokenHelper.generateAlphanumeric(12);

    try {
      // Create a new plan
      const plan = new Plan();
      plan.name = payload.name;
      plan.description = payload.description;
      plan.amount = payload.amount;
      plan.userId = user.id;
      // plan.category = payload.category;
      // plan.time = payload.time;
      plan.targetAmount = payload.target_amount;
      plan.interval = payload.interval.toUpperCase() as "DAILY" | "WEEKLY" | "MONTHLY";
      plan.startDate = DateTime.fromISO(payload.start_date.toISOString());
      plan.endDate = DateTime.fromISO(payload.end_date.toISOString());
      plan.interestRate = payload.interest
      plan.planTypeId = payload.plan_id
      const paystackPlan = await this.paystackService.createPlan(
        payload.name,
      
        payload.description,
        payload.amount * 100, // Paystack amount is in kobo
        payload.interval.toLowerCase()
      );
      plan.planCode = paystackPlan.plan_code;

      const data = await plan.save();
      // Check if user has a card for automatic subscription
      const access_code = await UserCard.findBy('user_id', user.id)
      
      // Create plan subscriber record
      const userSavings = new PlanSubscriber();
      userSavings.userId = user.id;
      userSavings.planId = data.id;
      userSavings.status = access_code ? 'Active' : 'Pending';
      userSavings.startDate = DateTime.fromISO(payload.start_date.toISOString());
      userSavings.endDate = DateTime.fromISO(payload.end_date.toISOString());
      userSavings.subscriptionCode = `SAV-${referenceCode}-manual`
      userSavings.emailToken = `SAV-${referenceCode}-manual`
      
      // Only create subscription if user has a card
      if (access_code) {
        const create_subscription = await this.paystackService.createSubscription(user.email, plan.planCode, access_code.token);
        userSavings.subscriptionCode = create_subscription.subscription_code;
        userSavings.emailToken = create_subscription.email_token;
      }

      await userSavings.save();

      return response.status(201).send({
        message: 'Plan created successfully'
      });
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @getUsersPlan
   * @description Get all user's plan subscriptions
   * @responseBody 200 - {"plans": [{"id": 1, "plan": {"name": "My Plan"}, "currentAmount": 25000, "status": "Active"}]}
   * @responseBody 403 - {"message": "Error message"}
   */
  async getUsersPlan({ auth, response }: HttpContext) {
    try {
      const user = await auth.user!
      const plans = await PlanSubscriber.query()
        .where('user_id', user.id)
        .preload('plan')
        .preload('otherSubscribers')
        .preload('transactions')
      return response.status(200).json({ plans })
    }
    catch (err) {
      return response.forbidden(err.message)
    }

  }

  /**
   * @getPlan
   * @description Get plan details by plan code
   * @requestParams {"plan_code": "pln_123456789"}
   * @responseBody 200 - {"plan": {"id": 1, "name": "My Plan", "amount": 5000, "planCode": "pln_123456789"}}
   * @responseBody 500 - {"message": "An error occurred while fetching the plan"}
   */
  async getPlan({ params, response }: HttpContext) {
    // 
    try {
      const plan = await Plan.findByOrFail('plan_code', params.plan_code)
      return response.status(200).json({
        plan
      });
    } catch (error) {
      console.log(error)
      return response.status(500).send({
        message: 'An error occurred while fetching the plan',
        error: error.message,
      });
    }
  }


  /**
   * @joinPlan
   * @description Subscribe to an existing plan
   * @requestParams {"plan_code": "pln_123456789"}
   * @responseBody 200 - {"message": "Plan Subscribed Successfully"}
   * @responseBody 404 - {"message": "Plan not found"}
   * @responseBody 403 - {"message": "No Debit card found"}
   * @responseBody 500 - {"error": "Error message"}
   */
  async joinPlan({ auth, response, params }: HttpContext) {
    const user = auth.user!;

    try {
      const plan = await Plan.findBy('plan_code', params.plan_code);
      if (!plan) {
        return response.status(404).send({
          message: 'Plan not found',
        });
      }
      const access_code = await UserCard.findBy('user_id', user.id)

      if (access_code === null) {
        return response.forbidden({
          message: 'No Debit card found',
        });
      }

      const planExist = await PlanSubscriber.query().where('plan_id', plan.id).where('user_id', user.id).first()
      if (planExist) {
        return response.forbidden({
          message: 'This subscription is already in place',
        });
      }
      const create_subscription = await this.paystackService.createSubscription(user.email, plan.planCode, access_code?.token);
      // Create and save to Savings table
      const userSavings = new PlanSubscriber();
      userSavings.userId = user.id;
      userSavings.planId = plan.id;
      userSavings.status = 'Active';
      userSavings.subscriptionCode = create_subscription.subscription_code;
      userSavings.emailToken = create_subscription.email_token
      userSavings.startDate = DateTime.now()
      userSavings.endDate = plan.endDate;
      await userSavings.save();
      return response.status(200).json({ message: 'Plan Subscribed Successfully' });
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }

  /**
   * @getUserPlanTransactions
   * @description Get plan transaction history
   * @requestParams {"plan_code": "sub_123456789"}
   * @responseBody 200 - {"message": "Plan Transaction Fetched Successfully", "data": [{"amount": 5000, "status": "success"}]}
   * @responseBody 500 - {"error": "Error message"}
   */
  async getUserPlanTransactions({ response, params }: HttpContext) {
    // const plan = await PlanSubscriber.findByOrFail('subscription_code', params.plan_code);

    try {
      const request = await this.paystackService.getSubscription(params.plan_code)
      // console.log(response)
      return response.status(200).json({ message: 'Plan Transaction Fetched Successfully', data: request });

    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }

  /**
   * @cancelSubscription
   * @description Cancel plan subscription with password verification
   * @requestParams {"id": "1"}
   * @requestBody {"password": "password123"}
   * @responseBody 200 - {"message": "Plan unsubscribed successfully"}
   * @responseBody 403 - {"message": "This savings plan is locked and cannot be broken"}
   */
  async cancelSubscription({ auth, params, request, response }: HttpContext) {
    try {
      const user = auth.user!;
      const { password } = request.only(['password']);

      // Verify password
      const isPasswordValid = await hash.verify(user.password, password)
      if (!isPasswordValid) {
        throw new Error('Invalid Credential');

      }
      const plan = await PlanSubscriber.query().where('plan_id', params.id).andWhere('user_id', user.id).firstOrFail();

      if (plan?.locked) {
        throw new Error('This savings plan is locked and cannot be broken');
      }

      if (plan?.status == "Cancelled") {
        throw new Error('This savings plan has been cancelled');
      }

      if (plan?.status == "Completed") {
        throw new Error('This savings plan has been completed');
      }

      // check if plan is less than 30 days
      const now = DateTime.now();
      const end = DateTime.fromJSDate(plan?.endDate ?? new Date());
      const diff = end.diff(now, 'days').days;
      if (diff < 30) {
        throw new Error('This savings plan is less than 30 days and cannot be broken');
      }
      const response = await this.paystackService.cancelSubscription(plan?.subscriptionCode || '', plan?.emailToken || '')

      await plan.merge({
        endDate: DateTime.now(),
        status: "Cancelled"
      }).save();

      const wallet = await Wallet
        .query()
        .where('user_id', user.id)
        .increment('amount', Number(plan?.currentAmount))

      // Fetch the updated record to confirm
      const updatedSubscriber = await PlanSubscriber.findByOrFail('user_id', user?.id)
      console.log('Updated amount:', updatedSubscriber.currentAmount)

      const realPlan = await Plan.findBy('id', plan?.planId)

      await WalletTransaction.create({
        userId: user.id,
        amount: plan?.currentAmount,
        transactionType: 'DEPOSIT',
        reference: realPlan?.planCode,
        walletId: wallet?.id
      })
      return response.status(200).json({ message: 'Plan unsubscribed successfull' });

    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @getPlanSubscribers
   * @description Get plan subscribers and transactions
   * @requestParams {"plan_id": "1"}
   * @responseBody 200 - {"message": "Plan Transaction Fetched Successfully", "data": {"planSubscribers": [], "planTransactions": []}}
   * @responseBody 500 - {"error": "Error message"}
   */
  async getPlanSubscribers({ response, params }: HttpContext) {
    try {
      const plansubscriber = await Plan.query()
        .where('id', params.plan_id)
        .preload('planSubscribers', (planSubscriberQuery) => {
          planSubscriberQuery.preload('user')
        }).preload('planType')
        .preload('planTransactions', (planTransactionQuery) => {
          planTransactionQuery.preload('user')
        })
        .first()
      return response.status(200).json({ message: 'Plan Transaction Fetched Successfully', data: plansubscriber });

    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }


  /**
   * @inviteMember
   * @description Invite user to join savings plan
   * @requestParams {"id": "1"}
   * @requestBody {"username": "johndoe"}
   * @responseBody 200 - {"message": "Member invited successfully"}
   * @responseBody 403 - {"message": "Error message"}
   */
  async inviteMember({ auth, request, params, response }: HttpContext) {
    const user = auth.user!;
    const { username } = request.only(['username']);

    try {
      const plan = await Plan.findOrFail(params.id);
      const invitedUser = await User.findByOrFail('username', username);

      // Add logic to send invitation (e.g., notification, email)
      await this.notificationService.sendPushNotification(
        invitedUser,
        '🎉 Plan Invite',
        // Plan invite notification message
        `${user.username} has invited you to join the ${plan.name} savings plan. use the code ${plan.planCode} to join`,
        { type: 'plan_invite' }
      )
      // send email
      // await this.emailService.sendEmail();

      return response.status(200).send({
        message: 'Member invited successfully',
      });
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @lockSavings
   * @description Lock savings plan with password verification
   * @requestParams {"id": "1"}
   * @requestBody {"password": "password123"}
   * @responseBody 200 - {"message": "Plan Savings locked successfully"}
   * @responseBody 403 - {"message": "Invalid credentials"}
   */
  async lockSavings({ auth, params, request, response }: HttpContext) {
    try {
      const user = auth.user!;
      const { password } = request.only(['password']);

      // Verify password
      const isPasswordValid = await hash.verify(user.password, password)
      if (!isPasswordValid) {
        return response.abort('Invalid credentials')
      }
      const plan = await PlanSubscriber.query().where('plan_id', params.id).andWhere('user_id', user.id).firstOrFail();
      plan.locked = true;
      await plan.save();
      return response.status(200).send({
        message: 'Plan Savings locked successfully',
      });
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @breakSavings
   * @description Break savings plan with penalty
   * @requestParams {"id": "1"}
   * @responseBody 200 - {"message": "Plan Savings Breaked successfully"}
   * @responseBody 403 - {"message": "This savings plan is locked and cannot be broken"}
   */
  async breakSavings({ auth, params, response }: HttpContext) {
    const user = auth.user!;

    try {
      const plan = await PlanSubscriber.findOrFail(params.id);

      if (plan.userId !== user.id) {
        return response.forbidden('You are not authorized to break this savings plan');
      }

      if (plan.locked) {
        return response.forbidden('This savings plan is locked and cannot be broken');
      }
      await this.paystackService.cancelSubscription(plan.subscriptionCode, plan.emailToken)


      // Calculate penalty (2.5% of savings)
      const penalty = plan.currentAmount * 0.025;
      const amountToReturn = plan.currentAmount - penalty;

      // Update user's wallet (assume there's a wallet model)
      const wallet: any = await user.related('wallet').query().first();
      wallet.amount = amountToReturn;
      await wallet.save();

      // Mark savings as broken
      plan.status = 'Cancelled';
      plan.currentAmount = 0;
      await plan.save();


      return response.status(200).send({
        message: 'Plan Savings Breaked successfully',
      });
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @getCustomerTransactions
   * @description Get transactions for specific plan subscription
   * @requestParams {"id": "1"}
   * @responseBody 200 - [{"id": 1, "amount": 5000, "transactionType": "DEPOSIT"}]
   * @responseBody 403 - {"message": "You are not authorized to view these transactions"}
   */
  async getCustomerTransactions({ auth, params, response }: HttpContext) {
    const user = auth.user!;

    try {
      const plan = await PlanSubscriber.findOrFail(params.id);

      if (plan.userId !== user.id) {
        return response.forbidden('You are not authorized to view these transactions');
      };
      return response.status(200).send(plan.transactions);
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @fundPlanFromWallet
   * @description Transfer funds from wallet to savings plan
   * @requestBody {"plan_id": 1, "amount": 10000}
   * @responseBody 200 - {"message": "Funds transferred to plan successfully", "walletTransaction": {}, "planTransaction": {}}
   * @responseBody 400 - {"message": "Invalid plan or amount"}
   * @responseBody 500 - {"message": "Error transferring funds to plan"}
   */
  async fundPlanFromWallet({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!;
      const { plan_id, amount } = request.only(['plan_id', 'amount']);
      
      if (!plan_id || !amount || isNaN(amount) || amount <= 0) {
        return response.badRequest({ message: 'Invalid plan or amount' });
      }

      const WalletService = (await import('#services/walletService')).default
      const result = await WalletService.transferWalletToPlan(user.id, plan_id, Number(amount))

      if (!result.success) {
        return response.badRequest({ message: result.message });
      }

      return response.ok({ 
        message: 'Funds transferred to plan successfully',
        walletTransaction: result.walletTransaction,
        planTransaction: result.planTransaction
      });
    } catch (error) {
      return response.internalServerError({ 
        message: 'Error transferring funds to plan', 
        error: error.message 
      });
    }
  }

}