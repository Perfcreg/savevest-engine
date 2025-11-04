// @ts-ignore
import schedule from 'node-schedule'
import logger from '@adonisjs/core/services/logger'
// import Wallet from '#models/wallet';
// import WalletTransaction from '#models/wallet_transaction';
import {CleanUploadsHandler, SavingExpireCronHandler} from './handlers/walletInterestCronHandler.js';
import { InterestCalculationHandler } from './handlers/savingsInterestCronHandler.js';


schedule.scheduleJob('0 0 * * *', async function () {
    await new SavingExpireCronHandler().run().catch((error) => logger.error('Wallet Handler: %o', error));
    logger.info('Complete all Saving due today interest process completed');
});

schedule.scheduleJob('0 12 * * *', async function () {
    await new CleanUploadsHandler().run().catch((error) => logger.error('Clearing Uploadsrr', error));
    logger.info('Every day at 12 noon cron job is running');
});


schedule.scheduleJob('0 0 * * *', async function () {
    await new InterestCalculationHandler().run().catch((error) => logger.error('Interest Update Error', error));
    logger.info('Every day at 12 midnight cron job is running');
});


logger.info('In-process Cron Jobs Registered!!!')