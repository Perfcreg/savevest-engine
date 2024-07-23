import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'
import Plan from '#models/plan'
import { PlanSubscriberValidator, createValidator } from '#validators/plan';
import { DateTime } from 'luxon';
import PlanSubscriber from '#models/plan_subcriber';
import GenerateTokenHelper from '#services//generateToken';
import UserCard from '#models/user_card';
export default class PlansController {
  /**
* @index
* @description fetch all users created plans
* @responseBody 201 - Savings Plan created successfully
*/
  async index({ auth, response }: HttpContext) {
    // const user = auth.user!;
    const userPlans = await Plan.all()
    return response.status(200).json(userPlans)
  }


  /**
  * @create
  * @description User create plan.
  * @responseBody 201 - Plan created successfully
  * @requestBody { "name": "Me and my friend contribution", "description": "Lorem plsems","amount": 10000,"plan_type": "SAVING", "target_amount": 50000, "interval": "MONTHLY", "category": "Accomodation", "time": "09:00pm", "start_date": "2024-03-04","end_date": "2025-03-04"}
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

      await paystackService.createSubscription(user.email, plan.planCode, access_code?.token);
      // Create and save to Savings table
      const userSavings = new PlanSubscriber();
      userSavings.userId = user.id;
      userSavings.planId = data.id;
      userSavings.status = 'Active';
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
    * @responseBody 200 - User's plans
    * @responseBody 404 - User not found
    * @requestParams { "id": "1" }
    */
  async getUsersPlan({ auth, response }: HttpContext) {
    try {
      const user = await auth.user!
      const plans = await user.load('plan')
      return response.status(200).json({ plans })
    }
    catch (err) {
      return response.forbidden(err.message)
    }

  }

  /**
   * @getPlan
   * @description Get a particular plan by ID.
   * @responseBody 200 - Plan details
   * @responseBody 404 - Plan not found
   * @requestParams { "id": "1" }
   */
  async getPlan({ params, response }: HttpContext) {
    try {
      const plan = await Plan.find(params.id);

      if (!plan) {
        return response.status(404).send({
          message: 'Plan not found',
        });
      }

      return response.status(200).send(plan);
    } catch (error) {
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
   * @responseBody 200 - Plan Subscribed Successfully
   * @responseBody 500 - User not found
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

      await paystackService.createSubscription(user.email, plan.planCode, access_code?.token);
      // Create and save to Savings table
      const userSavings = new PlanSubscriber();
      userSavings.userId = user.id;
      userSavings.planId = plan.id;
      userSavings.status = 'Active';
      userSavings.startDate = DateTime.now()
      userSavings.endDate = plan.endDate;
      await userSavings.save();
      return response.status(200).json({ message: 'Plan Subscribed Successfully' });
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }

  /**
   * @getPlanTransactions
   * @description - Get Plan Transactions
   * @requestParams {"plan_code": "pln_13123133"}
   * @responseBody 200 - { "message": "Plan Transactions Fetched Successfully", "data": [] }
   * @responseBody 500 - { "error": "Error Fetching Plan Transactions" }
   */
  async getPlanTransactions({ auth, response, params }: HttpContext) {
    const paystackService = new PaystackService();
    try {
      const response = await paystackService.fetchTransactions(params.plan_code)
      return response.status(200).json({ message: 'Plan Transaction Fetched Successfully', data: response.data });

    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }


  // cancel subscription

  async cancelSubscription({ auth, response }: HttpContext) {
    const user = await auth.user!
    const paystackService = new PaystackService();
    try {
      // first calculate all the user subscriptions amount and add it to the wallet
      const { code, token } = await paystackService.getCustomer(user.email)
      const getPlanTransactions = await paystackService.fetchTransactions({
        page: 10,
        perPage: 50,
        customer: user.paystack_id,
        status: "success",
        subscription: true,
      })

      const response = await paystackService.cancelSubscription(code, token)
      return response.status(200).json({ message: 'Plan Transaction Fetched Successfully', data: response.data });

    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }

}