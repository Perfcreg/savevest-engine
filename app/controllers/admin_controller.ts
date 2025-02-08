import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import Withdrawal from '#models/withdrawal'
import { DateTime } from 'luxon'
import PlanSubscriber from '#models/plan_subcriber'

export default class AdminController {
  async getDashboardData({ response }: HttpContext) {
    try {
      const totalUsers = await this.getTotalUsersWithGrowth()
      const totalActiveSavings = await this.getTotalActiveSavings()
      const totalWalletAmount = await this.getTotalWalletAmount()
      const totalWeeklyWithdrawal = await this.getTotalWeeklyWithdrawal()

      return response.ok({
        totalUsers,
        totalActiveSavings,
        totalWalletAmount,
        totalWeeklyWithdrawal
      })
    } catch (error) {
      return response.internalServerError({ message: 'An error occurred while fetching dashboard data', error: error.message })
    }
  }

  private async getTotalUsersWithGrowth() {
    const now = DateTime.now()
    const lastMonth = now.minus({ months: 1 })

    const totalUsers = await User.query().count('* as total')
    const lastMonthUsers = await User.query().where('created_at', '<', lastMonth.toSQL()).count('* as total')

    const currentTotal = totalUsers[0].$extras.total
    const lastMonthTotal = lastMonthUsers[0].$extras.total

    const growth = currentTotal - lastMonthTotal
    const growthPercentage = (growth / lastMonthTotal) * 100

    return {
      total: currentTotal,
      growthPercentage: growthPercentage.toFixed(2)
    }
  }

  private async getTotalActiveSavings() {
    const totalSavings = await PlanSubscriber.query()
      .where('status', 'Active')
      .sum('current_amount as total')

    return {
      total: totalSavings[0].$extras.total || 0
    }
  }
  private async getTotalWalletAmount() {
    const totalWallet = await Wallet.query()
      .sum('amount as total')
      console.log(totalWallet[0].$extras.total)

    return {
      total: totalWallet[0].$extras.total || 0
    }
  }

  private async getTotalWeeklyWithdrawal() {
    const oneWeekAgo = DateTime.now().minus({ weeks: 1 }).toSQL()

    const totalWithdrawal = await Withdrawal.query()
      .where('created_at', '>=', oneWeekAgo)
      .sum('amount as total')

    return {
      total: totalWithdrawal[0].$extras.total || 0
    }
  }


  async getUserList({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      const users = await User.query()
        .where('isActive', true)
        .paginate(page, limit)

      return response.ok(users)
    } catch (error) {
      return response.internalServerError({ message: 'An error occurred while fetching users', error: error.message })
    }
  }
  async createUser({ request, response }: HttpContext) {
    try {
      const userData = request.only(['email', 'password', 'username', 'firstName', 'lastName'])
      const user = await User.create(userData)
      return response.status(201).json({ message: 'User created successfully', user })
    } catch (error) {
      return response.status(400).json({ message: 'Error creating user', error: error.message })
    }
  }

  async banUser({ request, response }: HttpContext) {
    try {
      const { userId } = request.params()
      const user = await User.findOrFail(userId)
      user.isActive = false
      await user.save()
      return response.json({ message: 'User banned successfully', user })
    } catch (error) {
      return response.status(400).json({ message: 'Error banning user', error: error.message })
    }
  }

  async checkWithdrawals({ response }: HttpContext) {
    try {
      const withdrawals = await Withdrawal.query().preload('user')
      return response.json({ withdrawals })
    } catch (error) {
      return response.status(400).json({ message: 'Error fetching withdrawals', error: error.message })
    }
  }

  async getDailyAnalytics({ request, response }: HttpContext) {
    try {
      const { date } = request.qs()
      const startDate : any = DateTime.fromISO(date).startOf('day')
      const endDate : any = DateTime.fromISO(date).endOf('day')

      const dailyFunds = await WalletTransaction.query()
        .where('type', 'credit')
        .whereBetween('created_at', [startDate.toSQL(), endDate.toSQL()])
        .select('created_at')
        .sum('amount as totalAmount')
        .groupByRaw('HOUR(created_at)')
        .orderBy('created_at')

      const chartData = dailyFunds.map(fund => ({
        hour: DateTime.fromJSDate(fund.createdAt).toFormat('HH:00'),
        amount: Number(fund?.totalAmount)
      }))

      return response.json({ date, data: chartData })
    } catch (error) {
      return response.status(400).json({ message: 'Error fetching daily analytics', error: error.message })
    }
  }

  async getMonthlyAnalytics({ request, response }: HttpContext) {
    try {
      const { month, year } = request.qs()
      const startDate = DateTime.fromObject({ year: parseInt(year), month: parseInt(month) }).startOf('month')
      const endDate = DateTime.fromObject({ year: parseInt(year), month: parseInt(month) }).endOf('month')

      const monthlyFunds = await WalletTransaction.query()
        .where('type', 'credit')
        .whereBetween('created_at', [startDate.toSQL(), endDate.toSQL()])
        .select('created_at')
        .sum('amount as totalAmount')
        .groupByRaw('DATE(created_at)')
        .orderBy('created_at')

      const chartData = monthlyFunds.map(fund => ({
        date: DateTime.fromJSDate(fund.created_at).toFormat('yyyy-MM-dd'),
        amount: Number(fund.totalAmount)
      }))

      return response.json({ month, year, data: chartData })
    } catch (error) {
      return response.status(400).json({ message: 'Error fetching monthly analytics', error: error.message })
    }
  }
}