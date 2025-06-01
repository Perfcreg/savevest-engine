import PlanSubscriber from '#models/plan_subcriber'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // Generate random subscription codes and email tokens
    const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase()
    
    // Write your database queries inside the run method
    await PlanSubscriber.createMany([
      {
        userId: 6, // Client user
        planId: 1, // Emergency Fund plan
        interestEarned: 250,
        currentAmount: 5250,
        startDate: DateTime.now().minus({ days: 30 }),
        endDate: DateTime.now().plus({ months: 12 }),
        subscriptionCode: 'SUB-' + generateCode(),
        emailToken: generateCode(),
        locked: false,
        status: 'Active',
      },
      {
        userId: 6, // Client user
        planId: 2, // Vacation Fund plan
        interestEarned: 500,
        currentAmount: 10500,
        startDate: DateTime.now().minus({ days: 30 }),
        endDate: DateTime.now().plus({ months: 12 }),
        subscriptionCode: 'SUB-' + generateCode(),
        emailToken: generateCode(),
        locked: true,
        status: 'Active',
      },
    ])
  }
}