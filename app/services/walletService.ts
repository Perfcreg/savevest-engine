import { DateTime } from 'luxon'
import Database from '@adonisjs/lucid/services/db'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import PlanSubscriber from '#models/plan_subcriber'
import PlanTransaction from '#models/plans_transaction'
import User from '#models/user'

export default class WalletService {
  /**
   * Process wallet deposit with idempotency
   */
  static async processDeposit(userId: number, amount: number, reference: string, metadata: Record<string, any> = {}) {
    return Database.transaction(async (trx) => {
      // Check if transaction already exists
      const existingTransaction = await WalletTransaction.query({ client: trx })
        .where('reference', reference)
        .first()

      if (existingTransaction) {
        console.log(`Duplicate transaction detected: ${reference}`)
        return { success: false, message: 'Transaction already processed', transaction: existingTransaction }
      }

      // Get or create wallet
      let wallet = await Wallet.query({ client: trx })
        .where('user_id', userId)
        .first()

      if (!wallet) {
        wallet = await Wallet.create({
          user_id: userId,
          amount: 0
        }, { client: trx })
      }

  
      // Update wallet balance
      await wallet.merge({ amount: Number(wallet.amount) + amount }).save()
      // Create transaction record
      const transaction = await WalletTransaction.create({
        userId,
        walletId: wallet.id,
        amount,
        transactionType: 'DEPOSIT',
        reference,
        transactionDate: DateTime.now(),
        metadata: JSON.stringify(metadata)
      }, { client: trx })

      return { success: true, wallet, transaction }
    })
  }

  /**
   * Process wallet withdrawal with balance check
   */
  static async processWithdrawal(userId: number, amount: number, reference: string, metadata: Record<string, any> = {}) {
    return Database.transaction(async (trx) => {
      // Check for duplicate
      const existingTransaction = await WalletTransaction.query({ client: trx })
        .where('reference', reference)
        .first()

      if (existingTransaction) {
        return { success: false, message: 'Transaction already processed' }
      }

      // Get wallet with lock
      const wallet = await Wallet.query({ client: trx })
        .where('user_id', userId)
        .forUpdate()
        .firstOrFail()

      // Check sufficient balance
      if (Number(wallet.amount) < amount) {
        return { success: false, message: 'Insufficient balance' }
      }

      // Update balance
      await wallet.merge({ amount: Number(wallet.amount) - amount }).save()

      // Create transaction
      const transaction = await WalletTransaction.create({
        userId,
        walletId: wallet.id,
        amount,
        transactionType: 'WITHDRAWAL',
        reference,
        transactionDate: DateTime.now(),
        metadata: JSON.stringify(metadata)
      }, { client: trx })

      return { success: true, wallet, transaction }
    })
  }

  /**
   * Process plan subscription payment with idempotency
   */
  static async processPlanPayment(userId: number, planId: number, amount: number, reference: string, metadata: any = {}) {
    return Database.transaction(async (trx) => {
      // Check for duplicate
      const existingTransaction = await PlanTransaction.query({ client: trx })
        .where('receipt_id', reference)
        .first()

      if (existingTransaction) {
        console.log(`Duplicate plan transaction detected: ${reference}`)
        return { success: false, message: 'Transaction already processed', transaction: existingTransaction }
      }

      // Get plan subscription
      const subscription = await PlanSubscriber.query({ client: trx })
        .where('user_id', userId)
        .where('plan_id', planId)
        .forUpdate()
        .first()

      if (!subscription) {
        return { success: false, message: 'Subscription not found' }
      }

      // Update subscription balance
      await subscription.merge({
        currentAmount: Number(subscription.currentAmount || 0) + amount
      }).save()

      // Create plan transaction
      const transaction = await PlanTransaction.create({
        userId,
        planId,
        amount,
        transactionType: 'DEPOSIT',
        receiptId: reference,
        transactionId: `TXN_${Date.now()}_${userId}`,
        metadata: JSON.stringify(metadata)
      }, { client: trx })

      return { success: true, subscription, transaction }
    })
  }

  /**
   * Transfer from wallet to plan
   */
  static async transferWalletToPlan(userId: number, planId: number, amount: number) {
    return Database.transaction(async (trx) => {
      const reference = `WTP_${Date.now()}_${userId}`

      // Process wallet withdrawal
      const withdrawalResult = await this.processWithdrawal(userId, amount, `${reference}_OUT`, {
        type: 'plan_transfer',
        planId
      })

      if (!withdrawalResult.success) {
        return withdrawalResult
      }

      // Process plan deposit
      const depositResult = await this.processPlanPayment(userId, planId, amount, `${reference}_IN`, {
        type: 'wallet_transfer',
        walletTransactionId: withdrawalResult.transaction?.id
      })

      if (!depositResult.success) {
        throw new Error('Plan deposit failed after wallet withdrawal')
      }

      return { success: true, walletTransaction: withdrawalResult.transaction, planTransaction: depositResult.transaction }
    })
  }

  /**
   * Get wallet balance with verification
   */
  static async getWalletBalance(userId: number) {
    const wallet = await Wallet.query()
      .where('user_id', userId)
      .first()

    if (!wallet) {
      return { balance: 0, verified: true }
    }

    // Verify balance against transaction history
    const transactionSum = await WalletTransaction.query()
      .where('user_id', userId)
      .sum('amount as total')
      .groupBy('transaction_type')

    let calculatedBalance = 0
    transactionSum.forEach((row: any) => {
      if (row.transactionType === 'DEPOSIT') {
        calculatedBalance += parseFloat(row.$extras.total || 0)
      } else if (row.transactionType === 'WITHDRAWAL') {
        calculatedBalance -= parseFloat(row.$extras.total || 0)
      }
    })

    const isVerified = Math.abs(Number(wallet.amount) - calculatedBalance) < 0.01

    return {
      balance: Number(wallet.amount),
      calculatedBalance,
      verified: isVerified,
      discrepancy: Number(wallet.amount) - calculatedBalance
    }
  }

  /**
   * Get plan subscription balance with verification
   */
  static async getPlanBalance(userId: number, planId: number) {
    const subscription = await PlanSubscriber.query()
      .where('user_id', userId)
      .where('plan_id', planId)
      .first()

    if (!subscription) {
      return { balance: 0, verified: true }
    }

    // Verify against transaction history
    const transactionSum = await PlanTransaction.query()
      .where('user_id', userId)
      .where('plan_id', planId)
      .where('transaction_type', 'DEPOSIT')
      .sum('amount as total')

    const calculatedBalance = parseFloat(transactionSum[0].$extras.total || 0)
    const isVerified = Math.abs(Number(subscription.currentAmount || 0) - calculatedBalance) < 0.01

    return {
      balance: Number(subscription.currentAmount || 0),
      calculatedBalance,
      verified: isVerified,
      discrepancy: Number(subscription.currentAmount || 0) - calculatedBalance
    }
  }

  /**
   * Reconcile wallet balances
   */
  static async reconcileWallet(userId: number) {
    return Database.transaction(async (trx) => {
      const wallet = await Wallet.query({ client: trx })
        .where('user_id', userId)
        .forUpdate()
        .first()

      if (!wallet) return { success: false, message: 'Wallet not found' }

      // Calculate correct balance from transactions
      const deposits = await WalletTransaction.query({ client: trx })
        .where('user_id', userId)
        .where('transaction_type', 'DEPOSIT')
        .sum('amount as total')

      const withdrawals = await WalletTransaction.query({ client: trx })
        .where('user_id', userId)
        .where('transaction_type', 'WITHDRAWAL')
        .sum('amount as total')

      const correctBalance = (parseFloat(deposits[0].$extras.total || 0)) - (parseFloat(withdrawals[0].$extras.total || 0))

      const oldBalance = Number(wallet.amount)
      await wallet.merge({ amount: correctBalance }).save()

      return {
        success: true,
        oldBalance,
        newBalance: correctBalance,
        difference: correctBalance - oldBalance
      }
    })
  }
}