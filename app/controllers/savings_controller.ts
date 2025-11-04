import Saving from '#models/plan_subcriber';
import SavingsTransaction from '#models/plans_transaction';
import type { HttpContext } from '@adonisjs/core/http'
// import PaystackService from '#services/paystackService'
import GenerateTokenHelper from '#services//generateToken';
import IncentiveService from '#services/incentiveService';


export default class SavingsController {
  /**
   * @deposit
   * @description Deposit to savings plan via Paystack
   * @requestParams {"id": "1"}
   * @requestBody {"amount": 10000}
   * @responseBody 201 - {"message": "Deposit initiated successfully", "data": {"id": 1, "amount": 10000}}
   * @responseBody 403 - {"message": "Error message"}
   */
  async deposit({ auth, request, params, response }: HttpContext) {
    const user = auth.user!;
    const { amount} = request.only(['amount']);

    try {
      // Find the savings using the savings_id
      const saving = await Saving.findOrFail(params.id);

      // Initialize deposit using Paystack
      const reference_code = GenerateTokenHelper.generateAlphanumeric(12);
      // const paystackService = new PaystackService();

    //   const paymentResponse = await paystackService.cardDeposit(user_email, amount, reference_code);
      
      // Create savings transaction
      const savingsTransaction = new SavingsTransaction();
      savingsTransaction.userId = user.id;
      savingsTransaction.planId = saving.id;
      savingsTransaction.amount = amount;
      savingsTransaction.reference = reference_code;
      await savingsTransaction.save();

      // Create subscription and save to Savings table
    //   await paystackService.createSubscription(user_email, saving.plan.planCode, paymentResponse.access_code);

      // Update Saving record
      saving.currentAmount += amount;
      await saving.save();

      // Calculate and apply incentives
      await IncentiveService.calculateAndApplyIncentives(user.id);

      return response.status(201).send({
        message: 'Deposit initiated successfully',
        data: savingsTransaction,
      });
    } catch (error) {
      return response.forbidden(error.message);
    }
  }

  /**
   * @index
   * @description Get all user's savings transactions
   * @responseBody 200 - [{"id": 1, "amount": 5000, "transactionType": "DEPOSIT", "createdAt": "2024-01-01"}]
   * @responseBody 403 - {"message": "Error message"}
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


}