import Wallet from '#models/wallet';
import WalletTransaction from '#models/wallet_transaction';
import logger from '@adonisjs/core/services/logger'
import GenerateTokenHelper from '#services/generateToken';
import PlanSubscriber from '#models/plan_subcriber';
import PlanTransaction from '#models/plans_transaction';
import PaystackService from '#services/paystackService';
import NotificationService from '#services/notificationService';
import fs from 'fs'
import path from 'path'
export  class WalletInterestCronHandler {
    async run() {
        try {
            const wallets = await Wallet.all(); // Get all wallets
            wallets.forEach(async (wallet) => {
                const token = GenerateTokenHelper.generateAlphanumeric(10); // Generate a 10-character token
                const dailyInterest = (Number(wallet.amount) * 0.159) / 365; // Calculate daily interest
                const newBalance = (Number(wallet.amount) + dailyInterest); // Update balance
                await wallet.merge({ amount: newBalance }).save();
                const transaction = new WalletTransaction();
                transaction.walletId = wallet.id;
                transaction.amount = dailyInterest;
                transaction.transactionType = 'INTEREST';
                transaction.reference = `WalletInt_${wallet.id + token}`;
                transaction.userId = wallet.user_id;
                transaction.status = 'COMPLETED';
                await transaction.save(); // Save transaction to history
            });
        } catch (error) {
            logger.error(error)
        }
    }
}

// calculate interest of saving that are due to expire on this day and add the total funds with interest to our wallet
export  class SavingExpireCronHandler {
  private paystackService: PaystackService
  private notificationService: NotificationService
    constructor(){
    this.paystackService = new PaystackService()
    this.notificationService = new NotificationService()
    }
    async run(){
        try {
            const planSubscriber = await PlanSubscriber.all()
            // filer plans that will be ending today
            const plansEndingToday = planSubscriber.filter((plan: any) => {
                const planEndDate = new Date(plan.endDate)
                const today = new Date()
                return planEndDate <= today && plan.status === 'Active'
            })

            // calculate interest of each plan
            for (const plan of plansEndingToday) {
                try {
                    const token = GenerateTokenHelper.generateAlphanumeric(10); // Generate a 10-character token
                    // calculate total amount accumulate on the plan let say 15%
                    await plan.load('plan')
                    await plan.load('user')
                    const totalInterest = (Number(plan.currentAmount) / 100 ) * plan.plan.interestRate
                    const newPlanBalance = (Number(plan.currentAmount) + totalInterest); // Update balance

                    // Try to cancel subscription, but don't fail if it's already cancelled
                    try {
                        await this.paystackService.cancelSubscription(plan?.subscriptionCode || '', plan?.emailToken || '')
                    } catch (paystackError) {
                        logger.warn(`Failed to cancel subscription for plan ${plan.id}: ${paystackError.message}`)
                    }
               
                    await plan.merge({
                        currentAmount: newPlanBalance,
                         status: 'Completed',
                    }).save();

                    await PlanTransaction.create({
                        planId: plan.planId,
                        amount: newPlanBalance,
                        transactionType: 'WITHDRAWAL',
                        receiptId: `PlanInt_${plan.planId + token}`,
                        userId: plan.userId,
                        status: 'COMPLETED'
                    })
                    const wallet = await Wallet.query().where('user_id', plan.userId).first()
                    const newBalance = (Number(wallet?.amount) + newPlanBalance);

                    await wallet?.merge({ amount: newBalance }).save();
                    
                    await WalletTransaction.create({
                        walletId: wallet?.id,
                        amount: newPlanBalance,
                        transactionType: 'DEPOSIT',
                        reference: `PlanInt_${wallet?.id + token}`,
                        userId: plan.userId,
                        status: 'COMPLETED'
                    })

                    await this.notificationService.sendPushNotification(
                        plan.user,
                        '🎉 Plan completed Successfully',
                        `Your target goal for the ${plan.plan.name} plan has been achieved! 
                        Congratulations on reaching your savings goal! your total savings and 
                        interest has been deposited to your wallet 🎉`,
                        { type: 'subscription_created' }
                      )
                } catch (error) {
                    logger.error(`Error calculating interest for subscriber ${plan.id}:`, error)
                }
            }

        } catch (error) {
            logger.error(error)
        }
    }
}

// delete all content in uploads folder 

export class CleanUploadsHandler {
    async run() {
        try {
            const uploadsDir = path.join(process.cwd(), 'uploads')

            // Check if directory exists
            if (!fs.existsSync(uploadsDir)) {
                logger.info('Uploads directory does not exist')
                return
            }

            // Read all files in the directory
            const files = fs.readdirSync(uploadsDir)

            // Delete each file
            for (const file of files) {
                const filePath = path.join(uploadsDir, file)
                
                // Get file stats
                const stats = fs.statSync(filePath)

                // If it's a file, delete it
                if (stats.isFile()) {
                    fs.unlinkSync(filePath)
                    logger.info(`Deleted file: ${file}`)
                }
            }

            logger.info('Successfully cleaned uploads directory')
        } catch (error) {
            logger.error('Error cleaning uploads directory:', error)
        }
    }
}

