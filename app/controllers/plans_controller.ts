import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'
import Plan from '#models/plan'
import { createValidator } from '#validators/plan';
import { DateTime } from 'luxon';
import PlanSubscriber from '#models/plan_subcriber';
// import GenerateTokenHelper from '#services//generateToken';
import UserCard from '#models/user_card';
import Wallet from '#models/wallet';
import PlanType from '#models/plan_type';
import User from '#models/user';
import NotificationService from '#services/notificationService';
export default class PlansController {

  private paystackService: PaystackService
  private notificationService: NotificationService
  constructor() {
    this.paystackService = new PaystackService()
    this.notificationService = new NotificationService()
  }
  /**
* @index
* @description fetch all users created plans
* @responseBody 200 - All Plans 
*/
  async index({ response }: HttpContext) {
    const userPlans = await Plan.all()
    return response.status(200).json({
      message: 'Plan fetch successfully',
      data: userPlans
    });
  }

  /**
   * @getAllPlanType
   * @description fetch all plan types existing inside our app
   * @responseBody 200 - All Plan types
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
  * @createPlan
  * @description User create plan.
  * @responseBody 201 - {Plan created successfully}
  * @requestBody { "name": "Me and my friend contribution", "description": "Lorem plsems","amount": 10000,"plan_type": "SAVING", "target_amount": 50000, "interval": "MONTHLY", "category": "Accomodation", "time": "09:00pm", "start_date": "2024-03-04","end_date": "2025-03-04"}
  */

  async create({ auth, request, response }: HttpContext) {
    const user = auth.user!;
    const { ...payload } = await request.validateUsing(createValidator);
    // const referenceCode = GenerateTokenHelper.generateAlphanumeric(12);

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
      plan.interestEarned = payload.interest
      plan.interestRate = payload.interest

      plan.planTypeId = payload.plan_id

      const paystackPlan = await this.paystackService.createPlan(
        payload.name,
        payload.description,
        payload.amount * 100, // Paystack amount is in kobo
        payload.interval.toLowerCase()
      );

      plan.planCode = paystackPlan.plan_code;

      // Generate a reference code
      const access_code = await UserCard.findBy('user_id', user.id)

      if (access_code === null) {
        return response.forbidden({
          message: 'No Debit card found, Create a Card to continue',
        });
      }

      // create a paystack charge for the card to add it 

      // console.log(create_subscription)
      const create_subscription = await this.paystackService.createSubscription(user.email, plan.planCode, access_code?.token);

      const data = await plan.save();
      // Create and save to Savings table
      const userSavings = new PlanSubscriber();
      userSavings.userId = user.id;
      userSavings.planId = data.id;
      userSavings.status = 'Active';
      userSavings.subscriptionCode = create_subscription.subscription_code;
      userSavings.emailToken = create_subscription.email_token
      userSavings.startDate = DateTime.fromISO(payload.start_date.toISOString());
      userSavings.endDate = DateTime.fromISO(payload.end_date.toISOString());

      await userSavings.save();


      return response.status(201).send({
        message: 'Plan created successfully'
      });
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
    * @getUserPlans
    * @description Get all plans of a particular user.
    * @responseBody 200 - { User's plans}
    * @responseBody 404 - { User not found}
    * @requestParams { "id": "1" }
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
   * @description Get a particular plan by ID.
   * @responseBody 200 - {Plan details}
   * @responseBody 404 - {Plan not found}
   * @requestParams { "plan_code": "123232332" }
   */
  async getPlan({ params, response }: HttpContext) {
    // 
    try {
      const plan = await Plan.findByOrFail('plan_code', params.plan_code)
      console.log(plan)
      // const plan_subscribers =  await this.paystackService.getPlan(params.plan_code)
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
   * @description - User subscribe to another user's plan 
   * @requestParams { "plan_code": "pln_112122323" }
   * @responseBody 200 - {Plan Subscribed Successfully}
   * @responseBody 500 - {User not found}
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
   * @description - Get Plan Transactions
   * @requestParams {"plan_code": "pln_13123133"}
   * @responseBody 200 - { "message": "Plan Transactions Fetched Successfully", "data": [] }
   * @responseBody 500 - { "Error Fetching Plan Transactions" }
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
     * @cancelPlan
     * @description - User subscribe to another user's plan 
     * @requestParams { "plan_code": "pln_112122323" }
     * @responseBody 200 - Plan unsubscribed Successfully
     * @responseBody 500 - User not found
     */
  async cancelSubscription({ auth, response, params }: HttpContext) {
    const user = await auth.user!

    try {
      const plan = await Plan.findByOrFail('plan_code', params.plan_code)
      const subscription = await PlanSubscriber.query().where('plan_id', plan.id).andWhere('user_id', user.id).first()
      subscription?.endDate == DateTime.now()
      subscription?.status == 'Cancelled'
      const userWallet = await Wallet.findBy('user_id', user.id)
      if (userWallet) {
        userWallet.amount += subscription?.currentAmount || 0
        await userWallet.save()
      }
      await subscription?.save()
      const response = await this.paystackService.cancelSubscription(subscription?.subscriptionCode || '', subscription?.emailToken || '')
      return response.status(200).json({ message: 'Plan unsubscribed successfull' });

    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }

  /**
   * @getPlanSubscriber
   * @description - Get Plan Subscriber
   * @requestParams {"plan_id": "1"}
   * @responseBody 200 - { "message": "Plan Subscribers Fetched Successfully", "data": [] }
   * @responseBody 500 - { "Error Fetching Plan Subscribers" }
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
 * @description Invite a member to join a savings plan.
 * @responseBody 200 - Invitation sent successfully
 * @requestBody { username: "example_user" }
 * @requestParams { "id": "1" }
 * @responseBody 403 - Forbidden
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
        `${user.username} has invited you to join the ${plan.name} savings plan.`,
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
   * @description Lock a savings plan.
   * @responseBody 200 - Savings locked successfully
   * @requestParams { "id": "1" }
   * @responseBody 403 - Forbidden
   */
  async lockSavings({ auth, params, response }: HttpContext) {
    const user = auth.user!;

    try {
      const plan = await PlanSubscriber.findOrFail(params.id);

      if (plan.userId !== user.id) {
        return response.forbidden('You are not authorized to lock this savings plan');
      }

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
   * @description Break a savings plan before the withdrawal date.
   * @responseBody 200 - Savings broken successfully
   * @requestParams { "id": "1" }
   * @responseBody 403 - Forbidden
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
      const wallet : any = await user.related('wallet').query().first();
      wallet.amount = amountToReturn;
      await wallet.save();

      // Mark savings as broken
      plan.status = 'Cancelled';
      plan.currentAmount = 0;
      await plan.save();


      return response.status(200).send({
        message: 'Savings broken successfully, All savings has been added to wallet.',
        data: {
          amountReturned: amountToReturn,
          penalty: penalty,
        },
      });
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @getCustomerTransactions
   * @description Get all transactions for a specific savings plan.
   * @responseBody 200 - Success
   * @requestParams { "id": "1" }
   * @responseBody 403 - Forbidden
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

}