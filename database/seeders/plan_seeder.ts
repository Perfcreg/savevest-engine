import Plan from '#models/plan'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    await Plan.createMany([
      {
        name: 'EBF GROUP SAVINGS',
        description: 'A group savings plan with fixed contributions',
        planTypeId: 1,
        targetAmount: 50000,
        planCode: 'EMFUND001', 
        amount: 5000,
        userId: 6,
        interval: 'MONTHLY',
        startDate: DateTime.now(),
        endDate: DateTime.now().plus({ months: 12 }),
        interestRate: 5.5,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now()
      },
      
      {
        name: 'Vacation Fund',
        description: 'Savings for my annual vacation',
        planTypeId: 2,
        targetAmount: 120000,
        planCode: 'VACFUND001',
        amount: 10000,
        userId: 6,
        interval: 'MONTHLY',
        startDate: DateTime.now(),
        endDate: DateTime.now().plus({ months: 12 }),
        interestRate: 4.5,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now()
      },

      {
        name: 'House Down Payment',
        description: 'Savings for house down payment',
        planTypeId: 1,
        targetAmount: 1000000,
        planCode: 'HOUSE001',
        amount: 50000,
        userId: 5,
        interval: 'MONTHLY',
        startDate: DateTime.now(),
        endDate: DateTime.now().plus({ months: 36 }),
        interestRate: 6.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now()
      },
    ])
  }
}
