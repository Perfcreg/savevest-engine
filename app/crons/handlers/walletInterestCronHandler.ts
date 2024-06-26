import Wallet from '#models/wallet';
import WalletTransaction from '#models/wallet_transaction';
import logger from '@adonisjs/core/services/logger'
import GenerateTokenHelper from '#services/generateToken';
export default class WalletInterestCronHandler {
    async run() {
        try {
            const wallets = await Wallet.all(); // Get all wallets
            wallets.forEach(async (wallet) => {
                const token = GenerateTokenHelper.generateAlphanumeric(8); // Generate a 10-character token
                const dailyInterest = (Number(wallet.amount) * 0.159) / 365; // Calculate daily interest
                const newBalance = (Number(wallet.amount) + dailyInterest); // Update balance
                await wallet.merge({ amount: newBalance }).save();
                const transaction = new WalletTransaction();
                transaction.walletId = wallet.id;
                transaction.amount = dailyInterest;
                transaction.transactionType = 'INTEREST';
                transaction.reference = `WalletInt_${wallet.id + token}`;
                transaction.userId = wallet.user_id
                await transaction.save(); // Save transaction to history
            });
        } catch (error) {
            logger.error(error)
        }
    }
}