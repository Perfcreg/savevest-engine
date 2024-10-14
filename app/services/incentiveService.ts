import User from '#models/user'
import PlanSubscriber from '#models/plan_subcriber'
import SavingsTransaction from '#models/savings_transaction'

export default class IncentiveService {
  static INCENTIVE_VALUE = 10 // 10 points per incentive

  static async calculateAndApplyIncentives(userId: number) {
    try {
      const user = await User.findOrFail(userId)
      const referredUsers = await User.query().where('referal_by', user.referral_code)

      let totalIncentives = 0

      for (const referredUser of referredUsers) {
        const planSubscriptions = await PlanSubscriber.query().where('user_id', referredUser.id)
        
        for (const subscription of planSubscriptions) {
          const transactionCount = await SavingsTransaction.query()
            .where('plan_id', subscription.id)
            .count('* as total')

          const transactionsPerIncentive = 50
          const incentivesEarned = Math.floor(transactionCount[0].$extras.total / transactionsPerIncentive)
          
          totalIncentives += incentivesEarned
        }
      }

      const incentivePoints = totalIncentives * IncentiveService.INCENTIVE_VALUE
      user.referral_incentives += incentivePoints
      await user.save()

      return incentivePoints
    } catch (error) {
      console.error('Error calculating incentives:', error)
      throw error
    }
  }

  static async getUserTotalIncentives(userId: number): Promise<number> {
    try {
      const user = await User.findOrFail(userId)
      return user.referral_incentives
    } catch (error) {
      console.error('Error retrieving user incentives:', error)
      throw error
    }
  }
}