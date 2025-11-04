import { DateTime } from 'luxon'
import User from '#models/user'
import Wallet from '#models/wallet'
import PlanSubscriber from '#models/plan_subcriber'
import Withdrawal from '#models/withdrawal'

/**
 * Service for handling analytics data calculations
 */
export default class AnalyticsService {
  /**
   * Get growth metrics for a specific model with time period comparison
   * @param queryCallback Function that returns a query builder for the specific model
   * @param timeField Field to use for time-based filtering
   * @param valueField Field to aggregate (sum or count)
   * @param aggregateType Type of aggregation ('count' or 'sum')
   * @param additionalFilters Additional filters to apply to the query
   * @returns Growth metrics including total, growth percentage, and graph data
   */
  static async getGrowthMetrics({
    queryCallback,
    timeField = 'created_at',
    valueField = '*',
    aggregateType = 'count',
    additionalFilters = () => { },
    formatTotal = (value: any) => value,
  }: {
    queryCallback: () => any;
    timeField?: string;
    valueField?: string;
    aggregateType?: 'count' | 'sum';
    additionalFilters?: (query: any) => void;
    formatTotal?: (value: any) => any;
  }) {
    const now = DateTime.now()
    const lastMonth = now.minus({ months: 1 })

    // Get this month's data
    const thisMonthStart = now.startOf('month').toSQL()
    const thisMonthEnd = now.endOf('month').toSQL()

    let thisMonthQuery = queryCallback()
    additionalFilters(thisMonthQuery)
    thisMonthQuery = thisMonthQuery.whereBetween(timeField, [thisMonthStart, thisMonthEnd])

    const thisMonthData = aggregateType === 'count'
      ? await thisMonthQuery.count(`${valueField} as total`)
      : await thisMonthQuery.sum(`${valueField} as total`)

    // Get last month's data
    const lastMonthStart = lastMonth.startOf('month').toSQL()
    const lastMonthEnd = lastMonth.endOf('month').toSQL()

    let lastMonthQuery = queryCallback()
    additionalFilters(lastMonthQuery)
    lastMonthQuery = lastMonthQuery.whereBetween(timeField, [lastMonthStart, lastMonthEnd])

    const lastMonthData = aggregateType === 'count'
      ? await lastMonthQuery.count(`${valueField} as total`)
      : await lastMonthQuery.sum(`${valueField} as total`)

    // Get total data
    let totalQuery = queryCallback()
    additionalFilters(totalQuery)

    const totalData = aggregateType === 'count'
      ? await totalQuery.count(`${valueField} as total`)
      : await totalQuery.sum(`${valueField} as total`)

    // Get monthly data for past 6 months
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date = now.minus({ months: i })
      const startOfMonth = date.startOf('month').toSQL()
      const endOfMonth = date.endOf('month').toSQL()

      let monthlyQuery = queryCallback()
      additionalFilters(monthlyQuery)
      monthlyQuery = monthlyQuery.whereBetween(timeField, [startOfMonth, endOfMonth])

      const monthlyResult = aggregateType === 'count'
        ? await monthlyQuery.count(`${valueField} as total`)
        : await monthlyQuery.sum(`${valueField} as total`)

      monthlyData.push(monthlyResult[0]?.$extras?.total || 0)
    }

    const thisMonthValue = parseFloat(thisMonthData[0]?.$extras?.total || '0')
    const lastMonthValue = parseFloat(lastMonthData[0]?.$extras?.total || '0')

    // Calculate growth percentage
    let growthPercentage
    if (lastMonthValue > 0) {
      growthPercentage = ((thisMonthValue - lastMonthValue) / lastMonthValue * 100).toFixed(2)
    } else if (thisMonthValue > 0) {
      growthPercentage = 100
    } else {
      growthPercentage = 0
    }

    const isIncrease = thisMonthValue >= lastMonthValue

    return {
      total: formatTotal(totalData[0]?.$extras?.total || 0),
      growthPercentage,
      isIncrease,
      graphData: monthlyData
    }
  }

  /**
   * Get total users with growth metrics
   */
  static async getTotalUsersWithGrowth() {
    return this.getGrowthMetrics({
      queryCallback: () => User.query(),
    })
  }

  /**
   * Get banned users with growth metrics
   */
  static async getBannedUsersCount() {
    return this.getGrowthMetrics({
      queryCallback: () => User.query(),
      additionalFilters: (query) => query.where('is_active', false),
    })
  }

  /**
   * Get active savings with growth metrics
   */
  static async getTotalActiveSavings() {
    return this.getGrowthMetrics({
      queryCallback: () => PlanSubscriber.query(),
      valueField: 'current_amount',
      aggregateType: 'sum',
      additionalFilters: (query) => query.where('status', 'Active'),
      formatTotal: (value) => `₦ ${value || 0.00}`,
    })
  }

  /**
   * Get total wallet amount with growth metrics
   */
  static async getTotalWalletAmount() {
    return this.getGrowthMetrics({
      queryCallback: () => Wallet.query(),
      valueField: 'amount',
      aggregateType: 'sum',
      formatTotal: (value) => `₦ ${value || 0.00}`,
    })
  }

  /**
   * Get weekly withdrawal metrics
   */
  static async getTotalWeeklyWithdrawal() {
    const now = DateTime.now()
    const lastWeek = now.minus({ weeks: 1 })

    // Get this week's withdrawals
    const thisWeekStart = now.startOf('week').toSQL()
    const thisWeekEnd = now.endOf('week').toSQL()
    const thisWeekWithdrawals = await Withdrawal.query()
      .whereBetween('created_at', [thisWeekStart, thisWeekEnd])
      .sum('amount as total')

    // Get last week's withdrawals
    const lastWeekStart = lastWeek.startOf('week').toSQL()
    const lastWeekEnd = lastWeek.endOf('week').toSQL()
    const lastWeekWithdrawals = await Withdrawal.query()
      .whereBetween('created_at', [lastWeekStart, lastWeekEnd])
      .sum('amount as total')

    // Get total withdrawals
    const totalWithdrawals = await Withdrawal.query()
      .sum('amount as total')

    // Get daily withdrawal amounts for past 7 days
    const dailyWithdrawalAmounts = []
    for (let i = 6; i >= 0; i--) {
      const date = now.minus({ days: i })
      const startOfDay = date.startOf('day').toSQL()
      const endOfDay = date.endOf('day').toSQL()

      const dailyAmount = await Withdrawal.query()
        .whereBetween('created_at', [startOfDay, endOfDay])
        .sum('amount as total')

      dailyWithdrawalAmounts.push(dailyAmount[0]?.$extras?.total || 0)
    }

    const thisWeekAmount = parseFloat(thisWeekWithdrawals[0]?.$extras?.total || '0')
    const lastWeekAmount = parseFloat(lastWeekWithdrawals[0]?.$extras?.total || '0')

    // Calculate growth percentage
    let growthPercentage
    if (lastWeekAmount > 0) {
      growthPercentage = ((thisWeekAmount - lastWeekAmount) / lastWeekAmount * 100).toFixed(2)
    } else if (thisWeekAmount > 0) {
      growthPercentage = 100
    } else {
      growthPercentage = 0
    }

    const isIncrease = thisWeekAmount >= lastWeekAmount

    return {
      total: totalWithdrawals[0]?.$extras?.total || 0,
      growthPercentage,
      isIncrease,
      graphData: dailyWithdrawalAmounts
    }
  }

  /**
   * Get active withdrawal requests with growth metrics
   */
  static async getTotalActiveWithdrawalRequests() {
    return this.getGrowthMetrics({
      queryCallback: () => Withdrawal.query(),
    })
  }

  /**
   * Get plan subscriptions with growth metrics
   */
  static async getTotalPlanSubscriptionsWithGrowth() {
    return this.getGrowthMetrics({
      queryCallback: () => PlanSubscriber.query(),
      additionalFilters: (query) => query.where('status', 'Active'),
    })
  }

  /**
   * Get count of active users with savings
   */
  static async getActiveUsersWithSavingsCount() {
    return this.getGrowthMetrics({
      queryCallback: () => User.query()
        .whereIn('id', (subquery) => {
          subquery.select('user_id')
            .from('plan_subscribers')
            .where('status', 'Active')
            .distinct()
        }),
    })
  }

  /**
   * Get count of active users with significant wallet balance
   */
  static async getActiveUsersWithBalanceCount() {
    return this.getGrowthMetrics({
      queryCallback: () => User.query()
        .whereIn('id', (query) => {
          query.select('user_id')
            .from('wallets')
            .where('amount', '>', 10000)
            .distinct()
        })
    })
  }

  /**
  * Get count of total active users (either with savings or significant balance)
  */
  static async getTotalActiveUsersCount() {
    return this.getGrowthMetrics({
      queryCallback: () => User.query()
        .where((query) => {
          query.whereIn('id', (subquery) => {
            subquery.select('user_id')
              .from('plan_subscribers')
              .where('status', 'Active')
              .distinct()
          }).orWhereIn('id', (subquery) => {
            subquery.select('user_id')
              .from('wallets')
              .where('amount', '>', 10000)
              .distinct()
          })
        })
    })
  }

}