import UserBank from '#models/user_bank'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class UserBankSeeder extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    await UserBank.createMany([
      {
        user_id: 6, // Client user
        bankName: 'First Bank of Nigeria',
        accountNumber: '3012345678',
        bankCode: '011'
      },
      {
        user_id: 6, // Client user
        bankName: 'Guaranty Trust Bank',
        accountNumber: '0123456789',
        bankCode: '058'
      },
     
    ])
  }
}