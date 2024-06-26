import schedule from 'node-schedule'
import logger from '@adonisjs/core/services/logger'
import Wallet from '#models/wallet';
import WalletTransaction from '#models/wallet_transaction';
import WalletInterestCronHandler from './handlers/walletInterestCronHandler.js';


schedule.scheduleJob('* * * * *', async function () {
    await new WalletInterestCronHandler().run().catch((error) => logger.error('Walllet Handler: %o', error));
    logger.info('In-process')

})



logger.info('In-process Cron Jobs Registered!!!')
