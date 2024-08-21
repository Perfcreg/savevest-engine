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
export default class PlansController {
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
  async getPlanType({response}: HttpContext){
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
      plan.category = payload.category;
      plan.time = payload.time;
      plan.targetAmount = payload.target_amount;
      plan.interval = payload.interval.toUpperCase() as "DAILY" | "WEEKLY" | "MONTHLY";
      plan.startDate = DateTime.fromISO(payload.start_date.toISOString());
      plan.endDate = DateTime.fromISO(payload.end_date.toISOString());

      const paystackService = new PaystackService();
      const paystackPlan = await paystackService.createPlan(
        payload.name,
        payload.description,
        payload.amount * 100, // Paystack amount is in kobo
        payload.interval.toLowerCase()
      );

      plan.planCode = paystackPlan.plan_code;
      const data = await plan.save();

      // Generate a reference code
      const access_code = await UserCard.findBy('user_id', user.id)

      if (access_code === null) {
        return response.forbidden({
          message: 'No Debit card found',
        });
      }

      const create_subscription = await paystackService.createSubscription(user.email, plan.planCode, access_code?.token);
      console.log(create_subscription)
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
      .preload('otherSubscribers', (query) => {
        query.whereNot('user_id', user.id).preload('user')
      })
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
    // const paystackService = new PaystackService();
    try {
      const plan = await Plan.findByOrFail('plan_code', params.plan_code)
      
      // const plan_subscribers =  await paystackService.getPlan(params.plan_code)
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
    const paystackService = new PaystackService();
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
      if(planExist){
        return response.forbidden({
          message: 'This subscription is already in place',
        });
      }
      const create_subscription =  await paystackService.createSubscription(user.email, plan.planCode, access_code?.token);
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
    const paystackService = new PaystackService();
    try {
      const request = await paystackService.getSubscription(params.plan_code)
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
    const paystackService = new PaystackService();
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
      const response = await paystackService.cancelSubscription(subscription?.subscriptionCode || '', subscription?.emailToken || '') 
      return response.status(200).json({ message: 'Plan unsubscribed successfull'});

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
      const plansubscriber = await Plan.query().where('id', params.plan_id).preload('planSubscribers', (planSubscriberQuery) => {
        planSubscriberQuery.preload('user')
      }).preload('planType')
      .first()
      console.log(plansubscriber)
      return response.status(200).json({ message: 'Plan Transaction Fetched Successfully', data: plansubscriber });

    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }

}