import PlanTransaction from '#models/plans_transaction'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Generate random transaction IDs and receipt IDs
    const generateId = () => Math.random().toString(36).substring(2, 15).toUpperCase()

    // Write your database queries inside the run method
    await PlanTransaction.createMany([
      {
        userId: 6, // Client user
        planId: 1, // Emergency Fund plan
        amount: 5000,
        transactionType: 'DEPOSIT',
        receiptId: 'RCP' + generateId(),
        transactionId: 'TXN' + generateId(),
      },
      {
        userId: 6, // Client user
        planId: 2, // Vacation Fund plan
        amount: 10000,
        transactionType: 'DEPOSIT',
        receiptId: 'RCP' + generateId(),
        transactionId: 'TXN' + generateId(),
      },
      {
        userId: 6, // Client user
        planId: 2, // House Down Payment plan
        amount: 50000,
        transactionType: 'DEPOSIT',
        receiptId: 'RCP' + generateId(),
        transactionId: 'TXN' + generateId(),
      },
      {
        userId: 6, // Client user
        planId: 1, // Family Ajo plan
        amount: 20000,
        transactionType: 'DEPOSIT',
        receiptId: 'RCP' + generateId(),
        transactionId: 'TXN' + generateId(),
      },
      {
        userId: 6, // Client user
        planId: 2, // Stock Portfolio plan
        amount: 100000,
        transactionType: 'DEPOSIT',
        receiptId: 'RCP' + generateId(),
        transactionId: 'TXN' + generateId(),
      },
      {
        userId: 6, // Client user
        planId: 1, // Emergency Fund plan
        amount: 250,
        transactionType: 'INTEREST',
        receiptId: 'RCP' + generateId(),
        transactionId: 'TXN' + generateId(),
      },
      {
        userId: 6, // Client user
        planId: 2, // Vacation Fund plan
        amount: 500,
        transactionType: 'INTEREST',
        receiptId: 'RCP' + generateId(),
        transactionId: 'TXN' + generateId(),
      },
    ])
  }
}