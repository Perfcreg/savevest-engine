import type { HttpContext } from '@adonisjs/core/http'
// import PaystackService from '#services/paystackService'; // Replace 'path-to-paystack-service' with the actual path
import UserBank from '#models/user_bank';
// import User from '#models/user';
import { bankValidator } from '#validators/user_bank'; // Replace 'path-to-bank-validator' with the actual path
import PaystackService from '#services/paystackService';

export default class UserBanksController {

  /**
   * @get
   * @description Get user's saved bank accounts
   * @responseBody 200 - {"message": "Bank account found", "data": [{"id": 1, "bankName": "GTBank", "accountNumber": "1234567890"}]}
   * @responseBody 400 - {"message": "Error message"}
   */
  async get({ auth, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const bank = await UserBank.query().where('user_id', user.id)
      return response.status(200).json({
        message: 'Bank account found',
        data: bank,
      });
    } catch (error) {
      return response.status(400).send({ message: error.message });
    }
  }
  /**
   * @addBank
   * @description Add new bank account for withdrawals
   * @requestBody {"bank_code": "044", "account_number": "1234567890", "bank_name": "Access Bank"}
   * @responseBody 201 - {"message": "Bank account added successfully", "data": {"id": 1, "bankName": "Access Bank"}}
   * @responseBody 400 - {"message": "Bank already exists"}
   */
  async addBank({ auth, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const { bank_code, account_number, bank_name } = await request.validateUsing(bankValidator);

    try {
      const userBank = new UserBank();
      userBank.user_id = user.id;
      userBank.bankName = bank_name;
      userBank.accountNumber = account_number;
      userBank.bankCode = bank_code;

      const existingBank = await UserBank.findBy("account_number", account_number);
      if (existingBank) {
        return response.status(400).json({
          message: "Bank already exists",
        });
      }

     

      const allBanks = await UserBank.findManyBy("user_id", user.id)
      if (allBanks.length >= 2) {
        return response.status(400).json({
          message: "You can only add 2 banks",
        });
      }
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
   * @description Update existing bank account
   * @requestParams {"id": "1"}
   * @requestBody {"bank_code": "044", "account_number": "1234567890", "bank_name": "Access Bank"}
   * @responseBody 200 - {"message": "Bank account updated successfully", "data": {}}
   * @responseBody 400 - {"message": "Error message"}
   * @responseBody 403 - {"message": "Forbidden"}
   */
  async updateBank({ auth, request, response, params }: HttpContext) {
    const user = auth.user!;
    const bankId = params.id;
    const { bank_code, account_number, bank_name } = await request.validateUsing(bankValidator);

    try {
      const userBank = await UserBank.findOrFail(bankId);
      if (userBank?.user_id !== user.id) {
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

  /**
   * @deleteBank
   * @description Delete user's bank account
   * @requestParams {"id": "1"}
   * @responseBody 200 - {"message": "Bank account deleted"}
   * @responseBody 400 - {"message": "Error message"}
   */
  async deleteBank({ response, params }: HttpContext) {
    try {
      const bankId = params.id
      const userBank = await UserBank.findOrFail(bankId);
      userBank.delete()
      return response.status(200).send({
        message: 'Bank account deleted',
      });
    } catch (error) {
      return response.status(400).send({ message: error.message });

    }
  }
}