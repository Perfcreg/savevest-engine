import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'
import GenerateTokenHelper from '#services/generateToken'
import env from '#start/env'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import NotificationService from '#services/notificationService'
import User from '#models/user'
import UserBank from '#models/user_bank'
import Withdrawal from '#models/withdrawal'
import hash from '@adonisjs/core/services/hash'




export default class WalletsController {
  private paystackService: PaystackService
  private notificationService: NotificationService

  constructor() {
    this.paystackService = new PaystackService()
    this.notificationService = new NotificationService()
  }

  async createWithdrawal({ auth, request, response }: HttpContext) {
    try {
      const user = await auth.user!;
      const { amount, userBankId, password } = request.all();

      // Verify password
      const passwordValid = await hash.verify(password, user.password);
      if (!passwordValid) {
        return response.status(401).json({ message: "Invalid password" });
      }

      // Get user bank details
      const userBank = await UserBank.findOrFail(userBankId);

      // Check if user has sufficient balance
      const wallet = await Wallet.findBy('user_id', user.id);
      if (!wallet || wallet.amount < amount) {
        return response.status(400).json({ message: "Insufficient balance" });
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

    // complete transfer 
    async completeTransfer({auth,request, response} : HttpContext){
      const { amount, withdrawalId, pin } = request.all();
      const user = auth.user!
      const withdrawal = await Withdrawal.findOrFail(withdrawalId);
      const wallet = await Wallet.findByOrFail('user_id', user.id);
      // verify if user pin is the correct pin
      if (pin !== user.pin) {
        return response.status(400).json({ message: "Invalid User pin" });
      }
      // Initiate transfer
      const transferData = await this.paystackService.customerWithdrawal(
        amount,
        withdrawal.recipientCode,
        withdrawal.reference
      );

      // Update withdrawal status and wallet balance
      await withdrawal.merge({ status: transferData.status }).save();
      await wallet.merge({ amount: wallet.amount - amount }).save();

      // Create wallet transaction record
      await WalletTransaction.create({
        walletId: wallet.id,
        amount: amount,
        reference: withdrawal.reference,
        transactionType: 'WITHDRAWAL',
        userId: user.id
      });
  }


  async handlePaystackWebhook({ request, response }: HttpContext) {
    const signature = request.header('x-paystack-signature')
    const body: any = await request.raw()

    if (!signature || !await this.paystackService.verifyWebhookSignature(signature, body)) {
      return response.status(400).send({ error: 'Invalid signature' })
    }

    const eventData = JSON.parse(body)
    const event = eventData.event
    const transactionData = eventData.data


    //subscription.create
    if (event === 'subscription.create') {
      const user = await User.findBy('paystack_id', transactionData.customer.customer_code)

      await this.notificationService.sendPushNotification(
        user,
        '🎉 Subscription Successful',
        `Your subscription to the ${transactionData.plan.name}  plan! Your next billing date is ${transactionData.next_payment_date}. Welcome aboard! 🚀"`,
        { type: 'subscription_created' }
      )
    }

    // user add new card and charge was succefull
    if(event === 'charge.success' && transactionData.channel === 'card' && Object.keys(transactionData.plan).length === 0 && transactionData.plan.constructor === Object) {
      const user = await User.findBy('paystack_id', transactionData.customer.customer_code)
      await this.notificationService.sendPushNotification(
        user,
        '💳 Card Added Successfully',
        `Your card has been successfully added to your account. You're all set for future transactions! ✅`,
        { type: 'card_added' }
      )
    }


     // User was charged for a plan
     if(event === 'charge.success' && transactionData.channel === 'card' && Object.keys(transactionData.plan).length > 0 && transactionData.plan.constructor === Object) {
      const user = await User.findBy('paystack_id', transactionData.customer.customer_code)
      await this.notificationService.sendPushNotification(
        user,
        '💸 Subscription Charge',
        `You've been charged ${transactionData.amount / 100} for your ${transactionData.plan.name} subscription. Thank you for staying with us! 🙏`,
        { type: 'subcription' }
      )
    }

    if(event === "subscription.disable") {
      const user = await User.findBy('paystack_id', transactionData.customer.customer_code)
      await this.notificationService.sendPushNotification(
        user,
        '😢 Subscription Canceled',
        `Your subscription to the ${transactionData.plan.name} plan has been canceled. We are sad to see you go! 💔`,
        { type: 'subscription' }
      )
    }

    // charge success from a dedicated_nuban
    if (event === "charge.success" && transactionData.channel === "dedicated_nuban") {

      const user = await User.findBy('paystack_id', transactionData.customer.customer_code)
      // update user wallet amount to add funds
      const wallet = await Wallet.findByOrFail('user_id', user?.id)
      const newBalance = (Number(wallet.amount) + (transactionData.amount / 100)); // Update balance
      await wallet.merge({ amount: newBalance }).save();
      // save transaction to history
      const transaction = new WalletTransaction()
      transaction.walletId = wallet.id;
      transaction.amount = transactionData.amount / 100;
      transaction.transactionType = 'DEPOSIT';
      transaction.reference = transactionData.reference;
      transaction.userId = wallet.user_id
      await transaction.save(); // Save transaction to history

      await this.notificationService.sendPushNotification(
        user,
        '💰 Savevest Wallet Deposit',
        // `Your deposit of ${transactionData.amount / 100} was successfull`,
        `A deposit of ₦${transactionData.amount / 100} has been added to your wallet. Your new Savevest wallet balance  is ₦${wallet.amount}. Keep growing! 📈 `,
        { type: 'deposit_successful' }
      )
    }

    return response.status(200).send({ message: 'Webhook processed successfully' })
  }
  /**
   * Display a list of resource
   */
  async index({ response }: HttpContext) {
    const wallet = await Wallet.all()
    return response.status(200).json({ wallet })
  }

  /**
   * Display form to create a new record
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
   * Fund Wallet
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
   * Show individual record
   */
  async show({ auth, response }: HttpContext) {
    const user = await auth.user!
    const wallet = await Wallet.findBy('user_id', user.id)
    return response.status(200).json({ wallet })
  }

  async fetchWalletTransactions({ auth, response }: HttpContext) {
    const user = await auth.user!
    const paystackService = new PaystackService();
    const paystackTransactions = await paystackService.fetchTransactions({
      page: 1,
      perPage: 10,
    })
    const WalletPaystackTransactions = paystackTransactions.filter((transaction: { channel: string; customer: { customer_code: string } }) =>
      transaction.channel === "bank_transfer" &&
      transaction.customer && // Ensure customer object exists
      transaction.customer.customer_code === user.paystack_id
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
   * Edit individual record
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
   * Handle form submission for the edit action
   */
  // async update({ params, request }: HttpContext) {}

  // create DVA

  async createDVA({ auth, response }: HttpContext) {
    const user = await auth.user!
    const paystack = new PaystackService()
    const data = await paystack.createDedicatedVirtualAccount(user.paystack_id)
    console.log(data)
    const userBank = await UserBank.create({
      user_id: user.id,
      bankCode: "DVA",
      accountNumber: data.account_number,
      bankName: "Wema Bank",
    })

    return response.status(200).json({ userBank })
  }

  /**
   * Delete record
   */
  async destroy({ }: HttpContext) { }
}