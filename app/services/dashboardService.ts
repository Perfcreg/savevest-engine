import { DateTime } from 'luxon'
import User from '#models/user'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import PlanSubscriber from '#models/plan_subcriber'
import Withdrawal from '#models/withdrawal'
import PlanTransaction from '#models/plans_transaction'

/**
 * Service for handling dashboard-specific data and analytics
 */
export default class DashboardService {
  /**
   * Get daily analytics for wallet transactions
   * @param date The date to analyze
   * @returns Chart data for the specified day
   */
  static async getDailyAnalytics(date: string) {
    const startDate = DateTime.fromISO(date).startOf('day')
    const endDate = DateTime.fromISO(date).endOf('day')

    const dailyFunds = await WalletTransaction.query()
      .where('transactionType', 'DEPOSIT')
      .whereBetween('created_at', [startDate.toSQL(), endDate.toSQL()])
      .select('created_at')
      .sum('amount as totalAmount')
      .groupByRaw('HOUR(created_at)')
      .orderBy('created_at')

    return dailyFunds.map((fund: any) => ({
      hour: DateTime.fromJSDate(fund.createdAt).toFormat('HH:00'),
      amount: Number(fund?.$extras?.totalAmount || 0)
    }))
  }

  /**
   * Get monthly analytics for wallet transactions
   * @param month The month number (1-12)
   * @param year The year
   * @returns Chart data for the specified month
   */
  static async getMonthlyAnalytics(month: number, year: number) {
    const startDate = DateTime.fromObject({ year, month }).startOf('month')
    const endDate = DateTime.fromObject({ year, month }).endOf('month')

    const monthlyFunds = await WalletTransaction.query()
      .where('transactionType', 'DEPOSIT')
      .whereBetween('created_at', [startDate.toSQL(), endDate.toSQL()])
      .select('created_at')
      .sum('amount as totalAmount')
      .groupByRaw('DATE(created_at)')
      .orderBy('created_at')

    return monthlyFunds.map((fund: any) => ({
      date: DateTime.fromJSDate(fund.created_at).toFormat('yyyy-MM-dd'),
      amount: Number(fund.$extras?.totalAmount || 0)
    }))
  }

  /**
   * Get user statistics
   * @param userId The user ID
   * @returns User statistics including savings, withdrawals, and active plans
   */
  static async getUserStats(userId: number) {
    const totalSavings = await PlanSubscriber.query()
      .where('user_id', userId)
      .where('status', 'Active')
      .sum('current_amount as total')

    const totalWithdrawals = await Withdrawal.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .sum('amount as total')

    const activePlans = await PlanSubscriber.query()
      .where('user_id', userId)
      .where('status', 'Active')
      .count('* as total')

    return {
      totalSavings: totalSavings[0].$extras.total || 0,
      totalWithdrawals: totalWithdrawals[0].$extras.total || 0,
      activePlans: activePlans[0].$extras.total || 0,
    }
  }

  /**
   * Get paginated wallet transactions with filters
   * @param page Page number
   * @param limit Items per page
   * @param type Transaction type filter
   * @param startDate Start date filter
   * @param endDate End date filter
   * @returns Paginated transactions with metadata
   */
  static async getPaginatedTransactions(page: number, limit: number, type?: string, startDate?: string, endDate?: string) {
    const query = WalletTransaction.query()
      .preload('user')
      .orderBy('created_at', 'desc')

    if (type) {
      query.where('transactionType', type)
    }

    if (startDate && endDate) {
      query.whereBetween('created_at', [
        DateTime.fromISO(startDate).startOf('day').toSQL(),
        DateTime.fromISO(endDate).endOf('day').toSQL(),
      ])
    }

    return await query.paginate(page, limit)
  }

  /**
   * Get paginated plan transactions with filters
   * @param page Page number
   * @param limit Items per page
   * @param type Transaction type filter
   * @param startDate Start date filter
   * @param endDate End date filter
   * @returns Paginated plan transactions with metadata
   */
  static async getPaginatedPlanTransactions(page: number, limit: number, type?: string, startDate?: string, endDate?: string) {
    const query = PlanTransaction.query()
      .preload('user')
      .orderBy('created_at', 'desc')

    if (type) {
      query.where('transactionType', type)
    }

    if (startDate && endDate) {
      query.whereBetween('created_at', [
        DateTime.fromISO(startDate).startOf('day').toSQL(),
        DateTime.fromISO(endDate).endOf('day').toSQL(),
      ])
    }

    return await query.paginate(page, limit)
  }

  /**
   * Get paginated withdrawals with filters
   * @param page Page number
   * @param limit Items per page
   * @param status Status filter
   * @returns Paginated withdrawals with metadata
   */
  static async getPaginatedWithdrawals(page: number, limit: number, status?: string) {
    const query = Withdrawal.query()
      .preload('user')
      .preload('userBank')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    return await query.paginate(page, limit)
  }

  /**
   * Get paginated plan subscriptions with filters
   * @param page Page number
   * @param limit Items per page
   * @param status Status filter
   * @returns Paginated plan subscriptions with metadata
   */
  static async getPaginatedPlanSubscriptions(page: number, limit: number, status?: string) {
    const query = PlanSubscriber.query()
      .preload('user')
      .preload('planType')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    return await query.paginate(page, limit)
  }

  /**
   * Get paginated wallets
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated wallets with metadata
   */
  static async getPaginatedWallets(page: number, limit: number) {
    return await Wallet.query()
      .preload('user')
      .orderBy('amount', 'desc')
      .paginate(page, limit)
  }

  /**
   * Get paginated users
   * @param page Page number
   * @param limit Items per page
   * @param isActive Filter by active status
   * @returns Paginated users with metadata
   */
  static async getPaginatedUsers(page: number, limit: number, isActive: boolean = true) {
    return await User.query()
      .where('isActive', isActive)
      .preload('wallet')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
  }
}