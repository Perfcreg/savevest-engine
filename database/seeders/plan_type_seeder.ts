import PlanType from '#models/plan_type'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    await PlanType.createMany([
      {
        name: 'Group Target Savings',
        description: 'A savings plan with a fixed interest rate and duration',
        interestRate: 5.0,
        savingTypeId: 2, // Assuming savingTypeId 2 is for 'Savings'
      },
      {
        name: 'Individual Flexible Savings',
        description: 'A savings plan with flexible withdrawals and deposits',
        interestRate: 3.5,
        savingTypeId: 2, // Assuming savingTypeId 2 is for 'Savings'
      },
    ])
  }
}