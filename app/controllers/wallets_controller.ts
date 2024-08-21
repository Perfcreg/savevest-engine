import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '#services/paystackService'
import GenerateTokenHelper from '#services/generateToken'

import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'



export default class WalletsController {
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
}