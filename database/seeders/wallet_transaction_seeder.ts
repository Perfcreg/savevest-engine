import WalletTransaction from '#models/wallet_transaction'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    await WalletTransaction.createMany([
     
      {
        userId: 6, // Client user
        walletId: 3, // Client wallet
        amount: 50000,
        transactionType: 'DEPOSIT',
        reference: 'DEP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        transactionDate: DateTime.now().minus({ days: 20 }),
      },
      {
        userId: 6, // Client user
        walletId: 3, // Client wallet
        amount: 25000,
        transactionType: 'WITHDRAWAL',
        reference: 'WIT' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        transactionDate: DateTime.now().minus({ days: 15 }),
      },
      {
        userId: 6, // Client user
        walletId: 3, // Client wallet
        amount: 75000,
        transactionType: 'DEPOSIT',
        reference: 'DEP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        transactionDate: DateTime.now().minus({ days: 10 }),
      },
      {
        userId: 6, // Client user
        walletId: 3, // Client wallet
        amount: 5000,
        transactionType: 'INTEREST',
        reference: 'INT' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        transactionDate: DateTime.now().minus({ days: 5 }),
      },
      {
        userId: 6, // Client user
        walletId: 3, // Client wallet
        amount: 30000,
        transactionType: 'TRANSFER',
        reference: 'TRF' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        transactionDate: DateTime.now().minus({ days: 2 }),
      },
    ])
  }
}