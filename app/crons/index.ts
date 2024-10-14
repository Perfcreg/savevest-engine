// @ts-ignore
import schedule from 'node-schedule'
import logger from '@adonisjs/core/services/logger'
// import Wallet from '#models/wallet';
// import WalletTransaction from '#models/wallet_transaction';
import WalletInterestCronHandler from './handlers/walletInterestCronHandler.js';


schedule.scheduleJob('0 0 * * *', async function () {
    await new WalletInterestCronHandler().run().catch((error) => logger.error('Wallet Handler: %o', error));
    logger.info('Daily wallet interest process completed');
});



logger.info('In-process Cron Jobs Registered!!!')
