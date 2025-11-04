import type { HttpContext } from '@adonisjs/core/http'
import WalletService from '#services/walletService'
import User from '#models/user'
import PlanSubscriber from '#models/plan_subcriber'

export default class WalletReconciliationController {
  /**
   * @checkWalletBalance
   * @description Check wallet balance integrity and verification
   * @responseBody 200 - {"message": "Wallet balance check completed", "data": {"balance": 50000, "verified": true}}
   * @responseBody 500 - {"message": "Error checking wallet balance"}
   */
  async checkWalletBalance({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const balanceCheck = await WalletService.getWalletBalance(user.id)
      
      return response.ok({
        message: 'Wallet balance check completed',
        data: balanceCheck
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error checking wallet balance',
        error: error.message
      })
    }
  }

  /**
   * @checkPlanBalance
   * @description Check plan subscription balance integrity
   * @requestParams {"planId": "1"}
   * @responseBody 200 - {"message": "Plan balance check completed", "data": {"balance": 25000, "verified": true}}
   * @responseBody 500 - {"message": "Error checking plan balance"}
   */
  async checkPlanBalance({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const { planId } = params
      
      const balanceCheck = await WalletService.getPlanBalance(user.id, planId)
      
      return response.ok({
        message: 'Plan balance check completed',
        data: balanceCheck
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error checking plan balance',
        error: error.message
      })
    }
  }

  /**
   * @reconcileWallet
   * @description Reconcile wallet balance discrepancies
   * @responseBody 200 - {"message": "Wallet reconciliation completed", "data": {"oldBalance": 50000, "newBalance": 50100}}
   * @responseBody 500 - {"message": "Error reconciling wallet"}
   */
  async reconcileWallet({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const reconciliation = await WalletService.reconcileWallet(user.id)
      
      return response.ok({
        message: 'Wallet reconciliation completed',
        data: reconciliation
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error reconciling wallet',
        error: error.message
      })
    }
  }

  /**
   * @getUserBalances
   * @description Get all user balances with verification status
   * @responseBody 200 - {"message": "User balances retrieved successfully", "data": {"wallet": {"balance": 50000}, "plans": []}}
   * @responseBody 500 - {"message": "Error retrieving user balances"}
   */
  async getUserBalances({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      
      // Get wallet balance
      const walletBalance = await WalletService.getWalletBalance(user.id)
      
      // Get all plan balances
      const planSubscriptions = await PlanSubscriber.query()
        .where('user_id', user.id)
        .preload('plan')
      
      const planBalances = await Promise.all(
        planSubscriptions.map(async (subscription) => {
          const balance = await WalletService.getPlanBalance(user.id, subscription.planId)
          return {
            planId: subscription.planId,
            planName: subscription.plan.name,
            ...balance
          }
        })
      )
      
      return response.ok({
        message: 'User balances retrieved successfully',
        data: {
          wallet: walletBalance,
          plans: planBalances
        }
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving user balances',
        error: error.message
      })
    }
  }

  /**
   * @checkAllBalances
   * @description Admin: Check all users for balance discrepancies
   * @responseBody 200 - {"message": "Balance check completed", "totalUsers": 100, "discrepanciesFound": 5, "discrepancies": []}
   * @responseBody 500 - {"message": "Error checking all balances"}
   */
  async checkAllBalances({ response }: HttpContext) {
    try {
      const users = await User.query().preload('wallet')
      const discrepancies = []
      
      for (const user of users) {
        if (user.wallet) {
          const walletCheck = await WalletService.getWalletBalance(user.id)
          if (!walletCheck.verified) {
            discrepancies.push({
              userId: user.id,
              email: user.email,
              walletBalance: walletCheck.balance,
              calculatedBalance: walletCheck.calculatedBalance,
              discrepancy: walletCheck.discrepancy
            })
          }
        }
      }
      
      return response.ok({
        message: 'Balance check completed',
        totalUsers: users.length,
        discrepanciesFound: discrepancies.length,
        discrepancies
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error checking all balances',
        error: error.message
      })
    }
  }
}