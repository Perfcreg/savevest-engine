import Wallet from '#models/wallet'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    await Wallet.createMany([
      {
        user_id: 6, // Client user
        amount: 50000,
      },
    ])
  }
}