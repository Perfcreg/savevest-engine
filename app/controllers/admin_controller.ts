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
  /**
   * @getDashboardData
   * @description Get admin dashboard analytics data
   * @responseBody 200 - {"totalUsers": {}, "totalActiveSavings": {}, "totalWalletAmount": {}, "totalWeeklyWithdrawal": {}, "totalWithdrawalCount": {}, "totalSubscription": {}}
   * @responseBody 500 - {"message": "An error occurred while fetching dashboard data", "error": "Error message"}
   */
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

  /**
   * @getUserDashboardData
   * @description Get user analytics dashboard data
   * @responseBody 200 - {"totalUsers": {}, "activeUsers": {}, "bannedUsers": {}, "activeUsersWithSavings": {}, "activeUsersWithBalance": {}}
   * @responseBody 500 - {"message": "An error occurred while fetching user analytics data", "error": "Error message"}
   */
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

  /**
   * @getUsers
   * @description Get paginated list of users
   * @requestParams {"page": "1", "limit": "10"}
   * @responseBody 200 - Paginated users data
   * @responseBody 500 - {"message": "An error occurred while fetching users", "error": "Error message"}
   */
  async getUsers({ request, response }: HttpContext) {
    try {
      const page = request.param('page', 1)
      const limit = request.param('limit', 10)
      const users = await DashboardService.getPaginatedUsers(page, limit)
      return response.ok(users)
    } catch (error) {
      return response.internalServerError({ message: 'An error occurred while fetching users', error: error.message })
    }
  }

  /**
   * @createUser
   * @description Create new user account
   * @requestBody {"email": "user@example.com", "password": "password123", "username": "johndoe", "firstName": "John", "lastName": "Doe"}
   * @responseBody 201 - {"message": "User created successfully", "user": {}}
   * @responseBody 400 - {"message": "Error creating user", "error": "Error message"}
   */
  async createUser({ request, response }: HttpContext) {
    try {
      const userData = request.only(['email', 'password', 'username', 'firstName', 'lastName'])
      const user = await User.create(userData)
      return response.status(201).json({ message: 'User created successfully', user })
    } catch (error) {
      return response.status(400).json({ message: 'Error creating user', error: error.message })
    }
  }

  /**
   * @banUser
   * @description Ban user account
   * @requestParams {"userId": "1"}
   * @responseBody 200 - {"message": "User banned successfully", "user": {}}
   * @responseBody 400 - {"message": "Error banning user", "error": "Error message"}
   */
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

  /**
   * @checkWithdrawals
   * @description Get all withdrawal requests
   * @responseBody 200 - {"withdrawals": []}
   * @responseBody 400 - {"message": "Error fetching withdrawals", "error": "Error message"}
   */
  async checkWithdrawals({ response }: HttpContext) {
    try {
      const withdrawals = await Withdrawal.query().preload('user')
      return response.json({ withdrawals })
    } catch (error) {
      return response.status(400).json({ message: 'Error fetching withdrawals', error: error.message })
    }
  }

  /**
   * @getWalletDailyAnalytics
   * @description Get daily wallet analytics for specific date
   * @requestQuery {"date": "2024-01-01"}
   * @responseBody 200 - {"date": "2024-01-01", "data": []}
   * @responseBody 400 - {"message": "Error fetching daily analytics", "error": "Error message"}
   */
  async getWalletDailyAnalytics({ request, response }: HttpContext) {
    try {
      const { date } = request.qs()
      const startDate: any = DateTime.fromISO(date).startOf('day')
      const endDate: any = DateTime.fromISO(date).endOf('day')

      const dailyFunds = await WalletTransaction.query()
        .where('transactionType', 'DEPOSIT')
        .whereBetween('created_at', [
          startDate.toJSDate(),
          endDate.toJSDate()
        ])
        .select('created_at')
        .sum('amount as totalAmount')
        .groupByRaw('HOUR(created_at)')
        .orderBy('created_at')

      const chartData = dailyFunds.map(fund => ({
        hour: DateTime.fromJSDate(fund.createdAt).toFormat('HH:00'),
        amount: Number(fund.$extras.totalAmount)
      }))

      return response.json({ date, data: chartData })
    } catch (error) {
      return response.status(400).json({ message: 'Error fetching daily analytics', error: error.message })
    }
  }

  /**
   * @getMonthlyAnalytics
   * @description Get monthly analytics for specific month and year
   * @requestQuery {"month": "1", "year": "2024"}
   * @responseBody 200 - {"month": "1", "year": "2024", "data": []}
   * @responseBody 400 - {"message": "Error fetching monthly analytics", "error": "Error message"}
   */
  async getMonthlyAnalytics({ request, response }: HttpContext) {
    try {
      const { month, year } = request.qs()
      const startDate = DateTime.fromObject({ year: parseInt(year), month: parseInt(month) }).startOf('month')
      const endDate = DateTime.fromObject({ year: parseInt(year), month: parseInt(month) }).endOf('month')

      const monthlyFunds = await WalletTransaction.query()
        .where('transactionType', 'DEPOSIT')
        .whereBetween('created_at', [startDate.toJSDate(), endDate.toJSDate()])
        .select('created_at')
        .sum('amount as totalAmount')
        .groupByRaw('DATE(created_at)')
        .orderBy('created_at')

      const chartData = monthlyFunds.map(fund => ({
        date: DateTime.fromJSDate(fund.createdAt).toFormat('yyyy-MM-dd'),
        amount: Number(fund.$extras.totalAmount)
      }))

      return response.json({ month, year, data: chartData })
    } catch (error) {
      return response.status(400).json({ message: 'Error fetching monthly analytics', error: error.message })
    }
  }

  /**
   * @getSingleUser
   * @description Get single user details with relationships
   * @requestParams {"userId": "1"}
   * @responseBody 200 - {"user": {}}
   * @responseBody 404 - {"message": "User not found", "error": "Error message"}
   */
  async getSingleUser({ params, response }: HttpContext) {
    try {
      const { userId } = params
      const user = await User.query()
        .where('id', userId)
        .preload('wallet')
        .firstOrFail()
      return response.ok({ user })
    } catch (error) {
      return response.notFound({ message: 'User not found', error: error.message })
    }
  }


  /**
   * @getAllTransactions
   * @description Get paginated wallet transactions with filters
   * @requestQuery {"page": "1", "limit": "10", "type": "DEPOSIT", "startDate": "2024-01-01", "endDate": "2024-01-31"}
   * @responseBody 200 - {"data": [], "pagination": {}}
   * @responseBody 400 - {"message": "Page number must be greater than 0"}
   * @responseBody 500 - {"message": "Error fetching transactions", "error": "Error message"}
   */
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
        query.where('transactionType', type)
      }

      if (startDate && endDate) {
        query.whereBetween('created_at', [
          DateTime.fromISO(startDate).startOf('day').toJSDate(),
          DateTime.fromISO(endDate).endOf('day').toJSDate()
        ])
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

  /**
   * @getPlanTransactions
   * @description Get paginated plan transactions with filters
   * @requestQuery {"page": "1", "limit": "10", "type": "DEPOSIT", "startDate": "2024-01-01", "endDate": "2024-01-31"}
   * @responseBody 200 - {"data": [], "pagination": {}}
   * @responseBody 400 - {"message": "Page number must be greater than 0"}
   * @responseBody 500 - {"message": "Error fetching transactions", "error": "Error message"}
   */
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
        query.where('transactionType', type)
      }

      if (startDate && endDate) {
        query.whereBetween('created_at', [
          DateTime.fromISO(startDate).startOf('day').toJSDate(),
          DateTime.fromISO(endDate).endOf('day').toJSDate()
        ])
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
  /**
   * @getAllWallets
   * @description Get paginated wallets ordered by amount
   * @requestQuery {"page": "1", "limit": "10"}
   * @responseBody 200 - Paginated wallets data
   * @responseBody 500 - {"message": "Error fetching wallets", "error": "Error message"}
   */
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

  /**
   * @getAllWithdrawals
   * @description Get paginated withdrawals with status filter
   * @requestQuery {"page": "1", "limit": "10", "status": "pending"}
   * @responseBody 200 - Paginated withdrawals data
   * @responseBody 500 - {"message": "Error fetching withdrawals", "error": "Error message"}
   */
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

  /**
   * @createPlanType
   * @description Create new plan type
   * @requestBody {"name": "Fixed Savings", "description": "Fixed term savings", "minimum_amount": 1000, "maximum_amount": 100000, "interest_rate": 10, "duration": 12, "type": "fixed"}
   * @responseBody 201 - {"message": "Plan type created successfully", "planType": {}}
   * @responseBody 400 - {"message": "Error creating plan type", "error": "Error message"}
   */
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

  /**
   * @updatePlanType
   * @description Update existing plan type
   * @requestParams {"planTypeId": "1"}
   * @requestBody {"name": "Fixed Savings", "description": "Fixed term savings", "minimum_amount": 1000, "maximum_amount": 100000, "interest_rate": 10, "duration": 12, "type": "fixed"}
   * @responseBody 200 - {"message": "Plan type updated successfully", "planType": {}}
   * @responseBody 400 - {"message": "Error updating plan type", "error": "Error message"}
   */
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

  /**
   * @approveWithdrawal
   * @description Approve withdrawal request
   * @requestParams {"withdrawalId": "1"}
   * @responseBody 200 - {"message": "Withdrawal approved successfully", "withdrawal": {}}
   * @responseBody 400 - {"message": "Error approving withdrawal", "error": "Error message"}
   */
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

  /**
   * @getPlanSubscriptions
   * @description Get paginated plan subscriptions with status filter
   * @requestQuery {"page": "1", "limit": "10", "status": "Active"}
   * @responseBody 200 - Paginated plan subscriptions data
   * @responseBody 500 - {"message": "Error fetching plan subscriptions", "error": "Error message"}
   */
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

  /**
   * @getUserStats
   * @description Get user statistics summary
   * @requestParams {"userId": "1"}
   * @responseBody 200 - {"totalSavings": 50000, "totalWithdrawals": 10000, "activePlans": 3}
   * @responseBody 500 - {"message": "Error fetching user stats", "error": "Error message"}
   */
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

  /**
   * @updateUserProfile
   * @description Update user profile information
   * @requestParams {"userId": "1"}
   * @requestBody {"firstName": "John", "lastName": "Doe", "phone": "08034567890", "dob": "1990-01-01", "gender": "male", "next_of_kin": "Jane Doe"}
   * @responseBody 200 - {"message": "User profile updated successfully", "user": {}}
   * @responseBody 400 - {"message": "Error updating user profile", "error": "Error message"}
   */
  async updateUserProfile({ params, request, response }: HttpContext) {
    try {
      const { userId } = params
      const profileData = request.only([
        'firstName', 'lastName', 'phone', 'dob', 'gender', 'next_of_kin'
      ])

      const user = await User.findOrFail(userId)
      await user.merge(profileData).save()

      return response.ok({ message: 'User profile updated successfully', user })
    } catch (error) {
      return response.badRequest({
        message: 'Error updating user profile',
        error: error.message,
      })
    }
  }

  /**
   * @getUserTransactions
   * @description Get paginated user transactions
   * @requestParams {"userId": "1"}
   * @requestQuery {"page": "1", "limit": "10"}
   * @responseBody 200 - Paginated user transactions data
   * @responseBody 500 - {"message": "Error fetching user transactions", "error": "Error message"}
   */
  async getUserTransactions({ params, request, response }: HttpContext) {
    try {
      const { userId } = params
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      const transactions = await WalletTransaction.query()
        .where('userId', userId)
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok(transactions)
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching user transactions',
        error: error.message,
      })
    }
  }

  /**
   * @getUserSavings
   * @description Get paginated user savings plans
   * @requestParams {"userId": "1"}
   * @requestQuery {"page": "1", "limit": "10"}
   * @responseBody 200 - Paginated user savings data
   * @responseBody 500 - {"message": "Error fetching user savings", "error": "Error message"}
   */
  async getUserSavings({ params, request, response }: HttpContext) {
    try {
      const { userId } = params
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      const savings = await PlanSubscriber.query()
        .where('user_id', userId)
        .preload('plan')
        .preload('user')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok(savings)
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching user savings',
        error: error.message,
      })
    }
  }

  /**
   * @getUserWithdrawals
   * @description Get paginated user withdrawals
   * @requestParams {"userId": "1"}
   * @requestQuery {"page": "1", "limit": "10"}
   * @responseBody 200 - Paginated user withdrawals data
   * @responseBody 500 - {"message": "Error fetching user withdrawals", "error": "Error message"}
   */
  async getUserWithdrawals({ params, request, response }: HttpContext) {
    try {
      const { userId } = params
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      const withdrawals = await Withdrawal.query()
        .where('userId', userId)
        .preload('user')
        .preload('userBank')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok(withdrawals)
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching user withdrawals',
        error: error.message,
      })
    }
  }

  /**
   * @getUserActions
   * @description Get all user actions (transactions, savings, withdrawals)
   * @requestParams {"userId": "1"}
   * @requestQuery {"page": "1", "limit": "10"}
   * @responseBody 200 - {"transactions": [], "savings": [], "withdrawals": []}
   * @responseBody 500 - {"message": "Error fetching user actions", "error": "Error message"}
   */
  async getUserActions({ params, request, response }: HttpContext) {
    try {
      const { userId } = params
      const limit = request.input('limit', 10)

      const [transactions, savings, withdrawals] = await Promise.all([
        WalletTransaction.query()
          .where('userId', userId)
          .orderBy('created_at', 'desc')
          .limit(limit),
        PlanSubscriber.query()
          .where('user_id', userId)
          .preload('plan')
          .orderBy('created_at', 'desc')
          .limit(limit),
        Withdrawal.query()
          .where('userId', userId)
          .preload('userBank')
          .orderBy('created_at', 'desc')
          .limit(limit)
      ])

      return response.ok({
        transactions,
        savings,
        withdrawals
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching user actions',
        error: error.message,
      })
    }
  }

  /**
   * @rejectWithdrawal
   * @description Reject withdrawal request with reason
   * @requestParams {"withdrawalId": "1"}
   * @requestBody {"reason": "Insufficient documentation"}
   * @responseBody 200 - {"message": "Withdrawal rejected successfully", "withdrawal": {}, "reason": "Insufficient documentation"}
   * @responseBody 400 - {"message": "Error rejecting withdrawal", "error": "Error message"}
   */
  async rejectWithdrawal({ params, request, response }: HttpContext) {
    try {
      const { withdrawalId } = params
      const { reason } = request.only(['reason'])
      
      const withdrawal = await Withdrawal.findOrFail(withdrawalId)
      withdrawal.status = 'failed'
      await withdrawal.save()

      // You can add notification logic here
      return response.ok({ 
        message: 'Withdrawal rejected successfully', 
        withdrawal,
        reason 
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error rejecting withdrawal',
        error: error.message,
      })
    }
  }

  /**
   * @deletePlanType
   * @description Delete plan type if no active subscriptions
   * @requestParams {"planTypeId": "1"}
   * @responseBody 200 - {"message": "Plan type deleted successfully"}
   * @responseBody 400 - {"message": "Cannot delete plan type with active subscriptions"}
   */
  async deletePlanType({ params, response }: HttpContext) {
    try {
      const { planTypeId } = params
      const planType = await PlanType.findOrFail(planTypeId)
      
      // Check if plan type is being used
      const activeSubscriptions = await PlanSubscriber.query()
        .whereHas('plan', (planQuery) => {
          planQuery.where('plan_type_id', planTypeId)
        })
        .where('status', 'Active')
        .count('* as total')

      if (activeSubscriptions[0].$extras.total > 0) {
        return response.badRequest({
          message: 'Cannot delete plan type with active subscriptions'
        })
      }

      await planType.delete()
      return response.ok({ message: 'Plan type deleted successfully' })
    } catch (error) {
      return response.badRequest({
        message: 'Error deleting plan type',
        error: error.message,
      })
    }
  }

  /**
   * @getSystemStats
   * @description Get overall system statistics
   * @responseBody 200 - {"totalRevenue": 1000000, "totalUsers": 500, "activeUsers": 450, "totalSavings": 800000, "pendingWithdrawals": 10}
   * @responseBody 500 - {"message": "Error fetching system stats", "error": "Error message"}
   */
  async getSystemStats({ response }: HttpContext) {
    try {
      const totalRevenue = await WalletTransaction.query()
        .where('transactionType', 'DEPOSIT')
        .sum('amount as total')

      const totalUsers = await User.query().count('* as total')
      const activeUsers = await User.query()
        .where('isActive', true)
        .count('* as total')

      const totalSavings = await PlanSubscriber.query()
        .where('status', 'Active')
        .sum('current_amount as total')

      const pendingWithdrawals = await Withdrawal.query()
        .where('status', 'pending')
        .count('* as total')

      return response.ok({
        totalRevenue: totalRevenue[0].$extras.total || 0,
        totalUsers: totalUsers[0].$extras.total || 0,
        activeUsers: activeUsers[0].$extras.total || 0,
        totalSavings: totalSavings[0].$extras.total || 0,
        pendingWithdrawals: pendingWithdrawals[0].$extras.total || 0,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching system stats',
        error: error.message,
      })
    }
  }
}