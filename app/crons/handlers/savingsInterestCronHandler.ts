import { DateTime } from 'luxon'
// import Plan from '#models/plan';
import PlanSubscriber from '#models/plan_subcriber';

import logger from '@adonisjs/core/services/logger'
import PlanTransaction from '#models/plans_transaction';
import NotificationService from '#services/notificationService';


export class InterestCalculationHandler {
  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  private getDaysInYear(date: DateTime): number {
    return this.isLeapYear(date.year) ? 366 : 365
  }

  private calculateDailyInterest(
    principal: number,
    interestRate: number,
    daysInYear: number
  ): number {
    // Convert interest rate from percentage to decimal (10% = 0.10)
    const rateAsDecimal = interestRate / 100
    // Calculate daily interest: Principal × Rate ÷ Days in year
    const dailyInterest = (principal * rateAsDecimal) / daysInYear
    // Round to 2 decimal places
    return Number(dailyInterest.toFixed(2))
  }
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }

  async run() {
    try {
      const today = DateTime.now()
      const daysInYear = this.getDaysInYear(today)

      // Get all active plan subscribers
      const planSubscribers = await PlanSubscriber.query()
        .where('status', 'Active')
        .preload('plan')

      for (const subscriber of planSubscribers) {
        try {
          // Skip if plan is not loaded or currentAmount is 0
          if (!subscriber.plan || subscriber.currentAmount <= 0) {
            continue
          }

          // Calculate daily interest
          const dailyInterest = this.calculateDailyInterest(
            subscriber.currentAmount,
            subscriber.plan.interestRate,
            daysInYear
          )

          // Update the interest earned
          await subscriber.merge({
            interestEarned: Number(subscriber.interestEarned) + dailyInterest
          }).save()

          await PlanTransaction.create({
            userId: subscriber.userId,
            amount: dailyInterest,
            planId: subscriber.planId,
            transactionType: 'INTEREST',
            transactionId: `TXN_${subscriber.planId}_${subscriber.userId}_${Date.now()}`,
            receiptId: `#INT_${subscriber.planId}_${subscriber.userId}_${today.toLocaleString()}`
          })

          await this.notificationService.sendPushNotification(
            subscriber.user,
            '🎉 Daily Interest Earned',
            `Your savings ${subscriber.plan.name} plan has earned ${dailyInterest} today!`,
            { type: 'interest_created' }
          )
        } catch (error) {
          logger.error(
            `Error calculating interest for subscriber ${subscriber.id}: ${error.message}`
          )
          continue // Continue with next subscriber even if one fails
        }
      }
    } catch (error) {
        logger.error(`Error calculating daily interest: ${error.message}`)
    }
  }
}
