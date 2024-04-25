import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'; // Replace 'path-to-paystack-service' with the actual path
import UserBank from '#models/user_bank';
import User from '#models/user';
import { bankValidator } from '#validators/user_bank'; // Replace 'path-to-bank-validator' with the actual path


export default class UserBanksController {

    /**
   * @addBank
   * @description Add a new bank account to Paystack and save to user_banks table.
   * @responseBody 201 - Bank account added successfully
   * @requestBody {bank_code: "044", account_number: "1234567890"}
   * @responseBody 400 - Bad request
   * @responseBody 403 - Forbidden
   */
  async addBank({ auth, request, response }: HttpContext) {
    const user = auth.user!;
    const { bank_code, account_number, bank_name } = await request.validateUsing(bankValidator);

    try {
      const userBank = new UserBank();
      userBank.userId = user.id;
      userBank.bankName = bank_name;
      userBank.accountNumber = account_number;
      userBank.bankCode = bank_code;
      await userBank.save();

      return response.status(201).send({
        message: 'Bank account added successfully',
        data: userBank,
      });
    } catch (error) {
      return response.status(400).send({ message: error.message });
    }
  }

  /**
   * @updateBank
   * @description Update an existing bank account for the authenticated user.
   * @routeParam id - The ID of the bank account to be updated.
   * @responseBody 200 - Bank account updated successfully
   * @requestBody {bank_code: "044", account_number: "1234567890"}
   * @responseBody 400 - Bad request
   * @responseBody 403 - Forbidden
   */
  async updateBank({ auth, request, response, params }: HttpContext) {
    const user = auth.user!;
    const bankId = params.id;
    const { bank_code, account_number, bank_name } = await request.validateUsing(bankValidator);

    try {
    //   const paystackService = new PaystackService();
    //   const accountValidation = await paystackService.verifyAccount(account_number, bank_code);

    //   if (!accountValidation.status) {
    //     return response.status(400).send({ message: accountValidation.message });
    //   }

      const userBank = await UserBank.findOrFail(bankId);
      if (userBank.userId !== user.id) {
        return response.status(403).send({ message: 'Forbidden' });
      }

      userBank.bankName = bank_name;
      userBank.accountNumber = account_number;
      userBank.bankCode = bank_code;
      await userBank.save();

      return response.status(200).send({
        message: 'Bank account updated successfully',
        data: userBank,
      });
    } catch (error) {
      return response.status(400).send({ message: error.message });
    }
  }
}