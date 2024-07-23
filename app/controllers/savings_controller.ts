import Saving from '#models/plan_subcriber';
import SavingsTransaction from '#models/savings_transaction';
import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'
import GenerateTokenHelper from '#services//generateToken';


export default class SavingsController {
     /**
   * @depositToSavings
   * @description Initiate a payment through Paystack for an existing savings.
   * @responseBody 201 - Deposit initiated successfully
   * @requestBody { amount: 1000}
   * @requestParams { "id": "1" }
   * @responseBody 403 - Forbidden
   */
  async deposit({ auth, request, params, response }: HttpContext) {
    const user = auth.user!;
    const { amount} = request.only(['amount']);

    try {
      // Find the savings using the savings_id
      const saving = await Saving.findOrFail(params.id);

      // Initialize deposit using Paystack
      const reference_code = GenerateTokenHelper.generateAlphanumeric(12);
      const paystackService = new PaystackService();

    //   const paymentResponse = await paystackService.cardDeposit(user_email, amount, reference_code);
      
      // Create savings transaction
      const savingsTransaction = new SavingsTransaction();
      savingsTransaction.userId = user.id;
      savingsTransaction.savingsId = saving.id;
      savingsTransaction.amount = amount;
      savingsTransaction.reference = reference_code;
      await savingsTransaction.save();

      // Create subscription and save to Savings table
    //   await paystackService.createSubscription(user_email, saving.plan.planCode, paymentResponse.access_code);

      // Update Saving record
      saving.currentAmount += amount;
      await saving.save();

      return response.status(201).send({
        message: 'Deposit initiated successfully',
        data: savingsTransaction,
      });
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @getAllSavingsTransactions
   * @description Get all savings transactions for an authenticated user.
   * @responseBody 200 - Success
   * @responseBody 403 - Forbidden
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!;
    
    try {
      await user.load('savingsTransaction');
      return response.status(200).send(user.savingsTransaction);
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @responseBody 200 - Success
   * @responseBody 403 - Forbidden
   */
  async create
}