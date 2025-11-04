import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'
import GenerateTokenHelper from '#services/generateToken'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import NotificationService from '#services/notificationService'
import User from '#models/user'
import UserBank from '#models/user_bank'
import Withdrawal from '#models/withdrawal'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import PlanTransaction from '#models/plans_transaction'
import Plan from '#models/plan'
import PlanSubscriber from '#models/plan_subcriber'
import UserCard from '#models/user_card'




export default class WalletsController {
  private paystackService: PaystackService
  private notificationService: NotificationService

  constructor() {
    this.paystackService = new PaystackService()
    this.notificationService = new NotificationService()
  }


  private async updateAssociatedPlans(userId: number, userEmail: string, newAuthorizationCode: string) {
    const paystackService = new PaystackService();
    const subscriptions = await paystackService.listSubscriptions(userEmail);
    console.log(newAuthorizationCode)
    for (const subscription of subscriptions) {
      try {
        // Update the subscription with the new authorization code
        await paystackService.enableSubscription(subscription.subscription_code, newAuthorizationCode);

        // Update the subscription in your database
        await this.updateSubscriptionInDatabase(userId, subscription.subscription_code, newAuthorizationCode);
      } catch (error) {
        console.error(`Failed to update subscription ${subscription.subscription_code}:`, error);
        // Implement error handling or retry logic here
      }
    }
    // console.log(subscriptions)
  }

  private async updateSubscriptionInDatabase(userId: number, subscriptionCode: string, newAuthorizationCode: string) {
    const PlanSubscriber = (await import('#models/plan_subcriber')).default;

    const planSubscriber = await PlanSubscriber.query()
      .where('user_id', userId)
      .where('subscription_code', subscriptionCode)
      .first();

    if (planSubscriber) {
      planSubscriber.emailToken = newAuthorizationCode;
      await planSubscriber.save();
    }
  }


  /**
   * @createWithdrawal
   * @description Create withdrawal request
   * @requestBody {"amount": 10000, "bank": 1, "password": "password123"}
   * @responseBody 200 - {"message": "Withdrawal request created successfully", "data": {"id": 1, "amount": 10000, "status": "pending"}}
   * @responseBody 400 - {"message": "Insufficient balance"}
   * @responseBody 401 - {"message": "Invalid password"}
   * @responseBody 500 - {"message": "An error occurred while processing your withdrawal request"}
   */
  async createWithdrawal({ auth, request, response }: HttpContext) {
    try {
      const user = await auth.user!;
      const { amount, bank, password } = request.all();

      // Verify password
      const isPasswordValid = await hash.verify(user.password, password)
      if (!isPasswordValid) {
        return response.status(401).json({ message: "Invalid password" });
      }


      // Get user bank details
      const userBank = await UserBank.findOrFail(bank);

      // Check if user has sufficient balance
      const wallet = await Wallet.findBy('user_id', user.id);
      if (!wallet || wallet.amount < Number(amount)) {
        return response.status(400).json({ message: "Insufficient balance" });
      }

      // find any withdrawal involving the user that is activily pending, processing
      const pendingWithdrawal = await Withdrawal.query()
        .where('user_id', user.id)
        .whereIn('status', ['pending', 'processing', 'failed'])
        .first();

      if (pendingWithdrawal) {
        return response.status(400).json({ message: "You have a pending withdrawal" });
      }


      // check if user have withdraw twice today if then cancel the withdrawal request
      const today = DateTime.now().startOf('day').toISO()
      const withdrawalCount = await Withdrawal.query()
        .where('user_id', user.id)
        .where('created_at', '>=', today)
        .count('* as total')

      const totalWithdrawals = Number(withdrawalCount[0].$extras.total)

      if (totalWithdrawals >= 2) {
        return response.status(400).json({ message: "You have reached the maximum number of withdrawals for today" });
      }
      // Create Paystack transfer recipient
      const recipientData = await this.paystackService.createRecipient(
        `${user.firstName} ${user.lastName}`,
        userBank.accountNumber,
        userBank.bankCode
      );



      const withdrawal = await Withdrawal.create({
        userId: user.id,
        amount,
        userBankId: bank,
        status: 'pending',
        reference: `WTH_${GenerateTokenHelper.generateAlphanumeric(8)}`,
        recipientCode: recipientData.recipient_code,
      });
      // Create withdrawal record


      return response.status(200).json({
        message: "Withdrawal request created successfully",
        data: withdrawal,
      });
    } catch (error) {
      console.error("Failed to create withdrawal:", error);
      return response.status(500).json({
        message: "An error occurred while processing your withdrawal request"
      });
    }
  }

  /**
   * @completeTransfer
   * @description Complete withdrawal transfer with PIN verification
   * @requestBody {"withdrawalId": 1, "pin": "1234"}
   * @responseBody 200 - {"message": "Withdrawal Request Successful"}
   * @responseBody 400 - {"message": "Invalid User pin"}
   */
  async completeTransfer({ auth, request, response }: HttpContext) {
    const { withdrawalId, pin } = request.all();
    const user = auth.user!
    const withdrawal = await Withdrawal.findOrFail(withdrawalId);
    const wallet = await Wallet.findByOrFail('user_id', user.id);
    // verify if user pin is the correct pin
    if (pin !== user.pin) {
      return response.status(400).json({ message: "Invalid User pin" });
    }
    // Initiate transfer
    const transferData = await this.paystackService.customerWithdrawal(
      withdrawal.amount * 100,
      withdrawal.recipientCode,
      withdrawal.reference,
    );

    console.log(transferData)

    // Update withdrawal status and wallet balance
    await withdrawal.merge({
      status: 'processing',
      transferCode: transferData.transfer_code,
      transferReference: transferData.id
    }).save();


    // Create wallet transaction record
    await WalletTransaction.create({
      walletId: wallet.id,
      amount: withdrawal.amount,
      reference: withdrawal.reference,
      transactionType: 'WITHDRAWAL',
      userId: user.id
    });

    await wallet.merge({ amount: wallet.amount - withdrawal.amount }).save();

    await this.notificationService.sendPushNotification(
      user,
      '💰 Savevest Wallet Withdrawal',
      // `Your deposit of ${transactionData.amount / 100} was successfull`,
      `Your request withdraw of ₦${withdrawal.amount} has been successfull submitted. Your new Savevest wallet balance  will be  ₦${wallet.amount} once this completed. Keep growing! 📈 `,
      { type: 'wallet' }
    )

    // send email


    return response.status(200).send({ message: 'Withdrwal Request Successfull' })
  }

  /**
   * @handlePaystackWebhook
   * @description Handle Paystack webhook events
   * @responseBody 200 - {"message": "Webhook processed successfully"}
   * @responseBody 400 - {"error": "Invalid signature"}
   */
  async handlePaystackWebhook({ request, response }: HttpContext) {
    const signature = request.header('x-paystack-signature')
    const body: any = await request.raw()

    if (!signature || !await this.paystackService.verifyWebhookSignature(signature, body)) {
      return response.status(400).send({ error: 'Invalid signature' })
    }

    const eventData = JSON.parse(body)
    const event = eventData.event
    const transactionData = eventData.data
    const reference = transactionData.reference

    // Import WalletService
    const WalletService = (await import('#services/walletService')).default


    // user add new card and charge was successful
    if (event == 'charge.success' && transactionData.channel == 'card' && transactionData.metadata?.custom_fields?.[0]?.variable_name == 'Add_Card') {
      const user = await User.findByOrFail('email', transactionData.customer.email)

      const result = await WalletService.processDeposit(
        user.id,
        transactionData.amount / 100,
        reference,
        { type: 'card_addition', paystackData: transactionData }
      )

      if (result.success) {
        await UserCard.create({
          cardType: transactionData.authorization.card_type,
          expire: `${transactionData.authorization.exp_month}/ ${transactionData.authorization.exp_year}`,
          lastFour: transactionData.authorization.last4,
          token: transactionData.authorization.authorization_code,
          signature: transactionData.authorization.signature,
          userId: user.id
        })

        await this.notificationService.sendPushNotification(
          user,
          '💳 Card Added Successfully',
          `Your card has been successfully added, ₦${transactionData.amount / 100}.00 has been added to your wallet ✅`,
          { type: 'transaction' }
        )
      }
    }

    //subscription.create
    if (event == 'subscription.create') {
      const user = await User.findByOrFail('email', transactionData.customer.email)

      await this.notificationService.sendPushNotification(
        user,
        '🎉 Subscription Successful',
        `Your subscription to the ${transactionData.plan.name} plan! Your next billing date is ${transactionData.next_payment_date}. Welcome aboard! 🚀"`,
        { type: 'transaction' }
      )
    }

    // user fund a plan via card or any means
    if (event == 'charge.success' && transactionData.metadata?.plan_id) {
      const user = await User.findByOrFail('email', transactionData.customer.email)
      const plan = await Plan.findByOrFail('plan_code', transactionData.metadata.plan_id)

      const result = await WalletService.processPlanPayment(
        user.id,
        plan.id,
        transactionData.amount / 100,
        reference,
        { type: 'direct_payment', paystackData: transactionData }
      )

      if (result.success) {
        await this.notificationService.sendPushNotification(
          user,
          '💰 Plan Payment Successful',
          `Your payment of ₦${transactionData.amount / 100} for ${plan.name} was successful. Your new plan balance is ₦${result.subscription?.currentAmount}. Keep saving! 🎯`,
          { type: 'transaction' }
        )
      }
    }

    // User was charged for a plan subscription
    if (event == 'charge.success' && Object.keys(transactionData.plan).length > 0 && transactionData.plan.constructor == Object) {
      const user = await User.findByOrFail('email', transactionData.customer.email)
      const plan = await Plan.findByOrFail('plan_code', transactionData.plan.plan_code)

      const result = await WalletService.processPlanPayment(
        user.id,
        plan.id,
        transactionData.amount / 100,
        reference,
        { type: 'subscription_charge', paystackData: transactionData }
      )

      if (result.success) {
        await this.notificationService.sendPushNotification(
          user,
          '💸 Subscription Charge',
          `You've been charged ₦${transactionData.amount / 100} for your ${transactionData.plan.name} subscription. Thank you for staying with us! 🙏`,
          { type: 'transaction' }
        )
      }
    }

    // Plan Canceled

    if (event == "subscription.disable") {
      const user = await User.findBy('email', transactionData.customer.email)
      await this.notificationService.sendPushNotification(
        user,
        '😢 Subscription Canceled',
        `Your subscription to the ${transactionData.plan.name} plan has been canceled. We are sad to see you go! 💔`,
        { type: 'transaction' }
      )
    }

    // charge success from a dedicated_nuban
    if (event == "charge.success" && transactionData.channel == "dedicated_nuban") {
      const user = await User.findByOrFail('email', transactionData.customer.email)

      const result = await WalletService.processDeposit(
        user.id,
        transactionData.amount / 100,
        reference,
        { type: 'bank_transfer', paystackData: transactionData }
      )

      if (result.success) {
        await this.notificationService.sendPushNotification(
          user,
          '💰 Savevest Wallet Deposit',
          `A deposit of ₦${transactionData.amount / 100} has been added to your wallet. Your new Savevest wallet balance is ₦${result.wallet?.amount}. Keep growing! 📈`,
          { type: 'transaction' }
        )
      }
    }

    if (event == "customeridentification.success"){
      const user = await User.findByOrFail('email', transactionData.email)
      await user.merge({ bvn: true, kyc: true }).save()
      await this.notificationService.sendPushNotification(
        user,
        '🎉 BVN Completed Successful',
        `Your BVN has been approved successfully`,
        { type: 'security' }
      )
    }

    if (event == "customeridentification.failed"){
      const user = await User.findByOrFail('email', transactionData.email)
      await this.notificationService.sendPushNotification(
        user,
        'BVN failed ',
        `Account number or BVN is incorrect`,
        { type: 'verifivationa_failed' }
      )
    }

    return response.status(200).send({ message: 'Webhook processed successfully' })
  }

  /**
   * @handleSmileIdWebhook
   * @description Handle SmileID webhook events for KYC verification
   * @responseBody 200 - Webhook processed
   */
  async handleSmileIdWebhook({ request, response }: HttpContext) {
    console.log(request.raw)
    const body = request.body()
    const data = body.data
    const user = await User.findBy('email', data.email)
    if (data.status == 'approved') {
      await user?.merge({ kyc: true }).save()
      await this.notificationService.sendPushNotification(
        user,
        '🎉 KYC Completed Successful',
        `Your BVN has been approved successfully`,
        { type: 'security' }
      )
    } else {
      await user?.merge({ kyc: false }).save()
    }
  }


  /**
   * @index
   * @description Get all wallets (admin only)
   * @responseBody 200 - {"wallet": [{"id": 1, "amount": 50000, "user_id": 1}]}
   */
  async index({ response }: HttpContext) {
    const wallet = await Wallet.all()
    return response.status(200).json({ wallet })
  }

  /**
   * @create
   * @description Create wallet for user
   * @responseBody 201 - Wallet created successfully
   */
  async create({ auth, response }: HttpContext) {

    const user = await auth.user!
    await Wallet.create({
      user_id: user.id,
      amount: 0
    })
    return response.status(201)
  }


  /**
   * @fundWallet
   * @description Fund user wallet via Paystack
   * @requestBody {"amount": 10000}
   * @responseBody 200 - {"message": "Deposit successful", "data": {"authorization_url": "https://checkout.paystack.com/..."}}
   * @responseBody 500 - {"message": "An error occurred while processing your request"}
   */
  async fundWallet({ auth, request, response }: HttpContext) {
    try {
      const user = await auth.user!;
      const wallet = await Wallet.findBy('user_id', user.id);
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      const ref = "WAL_" + GenerateTokenHelper.generateAlphanumeric(6);
      const amount = request.input('amount');
      // Ensure amount is valid
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error("Invalid amount");
      }

      const paystack = new PaystackService();
      const { data } = await paystack.addDeposit(user.email, amount, ref);
      if (data.status) {
        // Using a database transaction to ensure atomicity
        await wallet.merge({
          amount: wallet.amount + amount
        }).save();
      }
      await WalletTransaction.create({
        walletId: wallet.id,
        amount: amount,
        reference: ref,
        transactionType: 'DEPOSIT',
        userId: user.id
      });
      return response.status(200).json({
        message: "Deposit successful",
        data: data
      });
    } catch (error) {
      console.error("Failed to fund wallet:", error);
      return response.status(500).json({
        message: "An error occurred while processing your request"
      });
    }
  }

  
  /**
   * @show
   * @description Get user wallet details
   * @responseBody 200 - {"wallet": {"id": 1, "amount": 50000, "user_id": 1}}
   */
  async show({ auth, response }: HttpContext) {
    const user = await auth.user!
    const wallet = await Wallet.findBy('user_id', user.id)
    return response.status(200).json({ wallet })
  }

  /**
   * @fetchWalletTransactions
   * @description Get user wallet transaction history
   * @responseBody 200 - {"transactions": [{"id": 1, "amount": 10000, "transactionType": "DEPOSIT", "status": "success"}]}
   */
  async fetchWalletTransactions({ auth, response }: HttpContext) {
    const user = await auth.user!
    const paystackService = new PaystackService();
    const paystackTransactions = await paystackService.fetchTransactions({
      page: 1,
      perPage: 10,
    })
    const WalletPaystackTransactions = paystackTransactions.filter((transaction: { channel: string; customer: { customer_code: string } }) =>
      transaction.channel == "bank_transfer" &&
      transaction.customer && // Ensure customer object exists
      transaction.customer.customer_code == user.paystack_id
    ).map((object: { amount: number; created_at: any; reference: any; status: any; id: any }) => {
      return {
        amount: object.amount / 100,
        transactionDate: object.created_at,
        reference: object.reference,
        transactionType: "DEPOSIT",
        status: object.status,
        id: object.id,
      }
    });

    const WalletTransactions = await WalletTransaction.query().where('user_id', user.id)

    const transactions = [...WalletTransactions, ...WalletPaystackTransactions].map(object => {
      return {
        id: object.id,
        status: object.status || 'success',
        reference: object.reference || null,
        amount: object.amount,
        transactionType: object.transactionType || null,
        transactionDate: object.transactionDate || null,
        createdAt: object.createdAt || null,
        updatedAt: object.updatedAt || null
      };
    });

    return response.status(200).json({ transactions })
  }

  /**
   * @edit
   * @description Edit wallet (internal use)
   * @requestBody {"amount": 10000}
   */
  async edit({ auth, request }: HttpContext) {
    const user = await auth.user!
    const wallet = await Wallet.findBy('user_id', user.id)
    const amount = request.input('amount')
    const paystack = new PaystackService()
    const { data } = await paystack.addDeposit(user.email, amount, GenerateTokenHelper.generateAlphanumeric(12))
    if (data.status) {
      await wallet?.merge({
        amount: wallet.amount + amount
      }).save()
    }
  }

  /**
   * @createDVA
   * @description Create Dedicated Virtual Account for user
   * @responseBody 200 - {"userBank": {"id": 1, "accountNumber": "1234567890", "bankName": "Wema Bank"}}
   * @responseBody 400 - {"message": "Please complete your KYC"}
   */
  async createDVA({ auth, response }: HttpContext) {
    const user = await auth.user!
    if(!user.kyc){
      return response.status(400).json({ message: "Please complete your KYC" })
    }
    const paystack = new PaystackService()
    const data = await paystack.createDedicatedVirtualAccount(user.email)
    const userBank = await UserBank.create({
      user_id: user.id,
      bankCode: "DVA",
      accountNumber: data.account_number,
      bankName: "Wema Bank",
    })

    return response.status(200).json({ userBank })
  }

  /**
   * @destroy
   * @description Delete wallet record
   */
  async destroy({ }: HttpContext) { }
}