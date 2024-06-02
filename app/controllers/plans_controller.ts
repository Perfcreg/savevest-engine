import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'
import Plan from '#models/plan'
import { createValidator } from '#validators/plan';
import { DateTime } from 'luxon';
import Saving from '#models/saving';
import GenerateTokenHelper from '#services//generateToken';
export default class PlansController {
  /**
* @index
* @description fetch all users created plans
* @responseBody 201 - Savings Plan created successfully
*/
  async index({ auth, response }: HttpContext) {
    const user = auth.user!;
    const userPlans = await Plan.findByOrFail('user_id', user.id)
    return response.status(200).json(userPlans)
  }
  

  /**
  * @create
  * @description User create plan.
  * @responseBody 201 - Plan created successfully
  * @requestBody { "name": "Me and my friend contribution", "description": "Lorem plsems","amount": 10000,"plan_type": "SAVING","target_amount": 50000,"interval": "MONTHLY","start_date": "2024-03-04","end_date": "2025-03-04"}
  */

  async create({ auth, request, response }: HttpContext) {
    const user = auth.user!;
    const { ...payload } = await request.validateUsing(createValidator);

    try {
        // Create a new plan
        const plan = new Plan();
        plan.name = payload.name;
        plan.description = payload.description;
        plan.amount = payload.amount;
        plan.planType = payload.plan_type;
        plan.userId = user.id;
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
        await plan.save();

        // Generate a reference code
        const referenceCode = GenerateTokenHelper.generateAlphanumeric(12);

        // Initialize card deposit and create subsription to plan
        await paystackService.cardDeposit(user.email, payload.amount * 100, referenceCode, plan.planCode,);
        // Create and save to Savings table
        const userSavings = new Saving();
        userSavings.userId = user.id;
        userSavings.planId = plan.id;
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
 async getUsersPlan({auth, response}: HttpContext){
   try{
    const user = await auth.user!
    const plans = await user.load('plan')
    return response.status(200).json({plans})
   }
   catch(err){
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
   * @getAllPlans
   * @description Get all plans.
   * @responseBody 200 - All plans
   * @responseBody 500 - An error occurred
   */
  public async getAllPlans({ response }: HttpContext) {
    try {
      const plans = await Plan.all();

      return response.status(200).send(plans);
    } catch (error) {
      return response.status(500).send({
        message: 'An error occurred while fetching the plans',
        error: error.message,
      });
    }
  }
}