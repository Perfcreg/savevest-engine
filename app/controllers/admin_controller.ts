import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import PlanTransaction from '#models/plans_transaction'
import Withdrawal from '#models/withdrawal'
import { DateTime } from 'luxon'
import PlanSubscriber from '#models/plan_subcriber'
import PlanType from '#models/plan_type'
import DashboardService from '#services/dashboardService'
import AnalyticsService from '#services/analyticsService'
export default class AdminController {
  // These private properties are used in the constructor and throughout the class
  // The analyticsService property appears unused because static methods are being called directly on the AnalyticsService class
  // instead of using the instance property. The dashboardService property is used in getUsers() method.

  async getDashboardData({ response }: HttpContext) {
    try {
      const totalUsers = await AnalyticsService.getTotalUsersWithGrowth()
      const totalActiveSavings = await AnalyticsService.getTotalActiveSavings()
      const totalWalletAmount = await AnalyticsService.getTotalWalletAmount()
      const totalWeeklyWithdrawal = await AnalyticsService.getTotalWeeklyWithdrawal()
      const totalWithdrawalCount = await AnalyticsService.getTotalActiveWithdrawalRequests()
      const totalSubscription = await AnalyticsService.getTotalPlanSubscriptionsWithGrowth()
      return response.ok({
        totalUsers,
        totalActiveSavings,
        totalWalletAmount,
        totalWeeklyWithdrawal,
        totalWithdrawalCount,
        totalSubscription
      })
    } catch (error) {
      return response.internalServerError({ message: 'An error occurred while fetching dashboard data', error: error.message })
    }
  }

  async getUserDashboardData({ response }: HttpContext) {
    try {
      const totalUsers = await AnalyticsService.getTotalUsersWithGrowth()
      const bannedUsers = await AnalyticsService.getBannedUsersCount()
      const activeUsersWithSavings = await AnalyticsService.getActiveUsersWithSavingsCount()
      const activeUsersWithBalance = await AnalyticsService.getActiveUsersWithBalanceCount()
      const activeUsers = await AnalyticsService.getTotalActiveUsersCount()

      return response.ok({
        totalUsers,
        activeUsers,
        bannedUsers,
        activeUsersWithSavings,
        activeUsersWithBalance,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred while fetching user analytics data',
        error: error.message
      })
    }
  }

  async getUsers({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const users = await DashboardService.getPaginatedUsers(page, limit)
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
      user.inactivePermantely = true

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

  async getWalletDailyAnalytics({ request, response }: HttpContext) {
    try {
      const { date } = request.qs()
      const startDate: any = DateTime.fromISO(date).startOf('day')
      const endDate: any = DateTime.fromISO(date).endOf('day')

      const dailyFunds = await WalletTransaction.query()
        .where('type', 'credit')
        .whereBetween('created_at', [
          startDate.toSQL() ?? startDate.toISO(),
          endDate.toSQL() ?? endDate.toISO()
        ])
        .select('created_at')
        .sum('amount as totalAmount')
        .groupByRaw('HOUR(created_at)')
        .orderBy('created_at')

      const chartData = dailyFunds.map(fund => ({
        hour: DateTime.fromISO(fund.createdAt).toFormat('HH:00'),
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

  async getSingleUser({ params, response }: HttpContext) {
    try {
      const { userId } = params
      const user = await User.query()
        .where('id', userId)
        .preload('wallet')
        .preload('subscription')
        .preload('savingsTransaction')
        .firstOrFail()
      return response.ok({ user })
    } catch (error) {
      return response.notFound({ message: 'User not found', error: error.message })
    }
  }


  async getAllTransactions({ request, response }: HttpContext) {
    try {
      const page = parseInt(request.input('page', 1))
      const limit = parseInt(request.input('limit', 10))
      const type = request.input('type') // 'credit' or 'debit'
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')

      // Validate pagination params
      if (page < 1) {
        return response.badRequest({ message: 'Page number must be greater than 0' })
      }

      if (limit < 1 || limit > 100) {
        return response.badRequest({ message: 'Limit must be between 1 and 100' })
      }

      const query = WalletTransaction.query()
        .preload('user')
        .orderBy('created_at', 'desc')

      if (type) {
        query.where('type', type)
      }

      if (startDate && endDate) {
        query.whereBetween('created_at', [
          DateTime.fromISO(startDate).startOf('day').toSQL() ?? '',
          DateTime.fromISO(endDate).endOf('day').toSQL() ?? '',])
      }

      const transactions = await query.paginate(page, limit)

      // Add pagination metadata
      const { meta, data } = transactions.toJSON()

      return response.ok({
        data,
        pagination: {
          total: meta.total,
          perPage: meta.per_page,
          currentPage: meta.current_page,
          lastPage: meta.last_page,
          firstPage: 1,
          firstPageUrl: meta.first_page_url,
          lastPageUrl: meta.last_page_url,
          nextPageUrl: meta.next_page_url,
          previousPageUrl: meta.previous_page_url
        }
      })

    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching transactions',
        error: error.message,
      })
    }
  }

  // Get all plansactions with pagination just like getAlltransaction
  async getPlanTransactions({ request, response }: HttpContext) {
    try {
      const page = parseInt(request.input('page', 1))
      const limit = parseInt(request.input('limit', 10))
      const type = request.input('type') // 'credit' or 'debit'
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')

      // Validate pagination params
      if (page < 1) {
        return response.badRequest({ message: 'Page number must be greater than 0' })
      }

      if (limit < 1 || limit > 100) {
        return response.badRequest({ message: 'Limit must be between 1 and 100' })
      }

      const query = PlanTransaction.query()
        .preload('user')
        .orderBy('created_at', 'desc')

      if (type) {
        query.where('type', type)
      }

      if (startDate && endDate) {
        query.whereBetween('created_at', [
          DateTime.fromISO(startDate).startOf('day').toSQL() ?? '',
          DateTime.fromISO(endDate).endOf('day').toSQL() ?? '',])
      }

      const transactions = await query.paginate(page, limit)

      // Add pagination metadata
      const { meta, data } = transactions.toJSON()

      return response.ok({
        data,
        pagination: {
          total: meta.total,
          perPage: meta.per_page,
          currentPage: meta.current_page,
          lastPage: meta.last_page,
          firstPage: 1,
          firstPageUrl: meta.first_page_url,
          lastPageUrl: meta.last_page_url,
          nextPageUrl: meta.next_page_url,
          previousPageUrl: meta.previous_page_url
        }
      })

    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching transactions',
        error: error.message,
      })
    }
  }
  async getAllWallets({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      const wallets = await Wallet.query()
        .preload('user')
        .orderBy('amount', 'desc')
        .paginate(page, limit)

      return response.ok(wallets)
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching wallets',
        error: error.message,
      })
    }
  }

  async getAllWithdrawals({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const status = request.input('status') // 'pending', 'completed', 'failed'

      const query = Withdrawal.query()
        .preload('user')
        .preload('userBank')
        .orderBy('created_at', 'desc')

      if (status) {
        query.where('status', status)
      }

      const withdrawals = await query.paginate(page, limit)
      return response.ok(withdrawals)
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching withdrawals',
        error: error.message,
      })
    }
  }

  async createPlanType({ request, response }: HttpContext) {
    try {
      const planData = request.only([
        'name',
        'description',
        'minimum_amount',
        'maximum_amount',
        'interest_rate',
        'duration',
        'type', // e.g., 'fixed', 'flexible'
      ])

      const planType = await PlanType.create(planData)
      return response.created({ message: 'Plan type created successfully', planType })
    } catch (error) {
      return response.badRequest({
        message: 'Error creating plan type',
        error: error.message,
      })
    }
  }

  async updatePlanType({ request, params, response }: HttpContext) {
    try {
      const { planTypeId } = params
      const planData = request.only([
        'name',
        'description',
        'minimum_amount',
        'maximum_amount',
        'interest_rate',
        'duration',
        'type',
      ])

      const planType = await PlanType.findOrFail(planTypeId)
      await planType.merge(planData).save()

      return response.ok({ message: 'Plan type updated successfully', planType })
    } catch (error) {
      return response.badRequest({
        message: 'Error updating plan type',
        error: error.message,
      })
    }
  }

  async approveWithdrawal({ params, response }: HttpContext) {
    try {
      const { withdrawalId } = params
      const withdrawal = await Withdrawal.findOrFail(withdrawalId)

      // Add your withdrawal processing logic here
      withdrawal.status = 'completed'
      await withdrawal.save()

      return response.ok({ message: 'Withdrawal approved successfully', withdrawal })
    } catch (error) {
      return response.badRequest({
        message: 'Error approving withdrawal',
        error: error.message,
      })
    }
  }

  async getPlanSubscriptions({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const status = request.input('status') // 'Active', 'Completed', etc.

      const query = PlanSubscriber.query()
        .preload('user')
        .preload('plan')
        .orderBy('created_at', 'desc')

      if (status) {
        query.where('status', status)
      }

      const subscriptions = await query.paginate(page, limit)
      return response.ok(subscriptions)
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching plan subscriptions',
        error: error.message,
      })
    }
  }

  async getUserStats({ params, response }: HttpContext) {
    try {
      const { userId } = params

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

      return response.ok({
        totalSavings: totalSavings[0].$extras.total || 0,
        totalWithdrawals: totalWithdrawals[0].$extras.total || 0,
        activePlans: activePlans[0].$extras.total || 0,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching user stats',
        error: error.message,
      })
    }
  }
}