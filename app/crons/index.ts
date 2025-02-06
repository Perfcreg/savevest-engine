// @ts-ignore
import schedule from 'node-schedule'
import logger from '@adonisjs/core/services/logger'
// import Wallet from '#models/wallet';
// import WalletTransaction from '#models/wallet_transaction';
import {CleanUploadsHandler} from './handlers/walletInterestCronHandler.js';
import { InterestCalculationHandler } from './handlers/savingsInterestCronHandler.js';


// schedule.scheduleJob('0 0 * * *', async function () {
//     await new WalletInterestCronHandler().run().catch((error) => logger.error('Wallet Handler: %o', error));
//     logger.info('Daily wallet interest process completed');
// });

// schedule.scheduleJob('0 0 * * *', async function () {
//     // await new SavingExpireCronHandler().run().catch((error) => logger.error('Wallet Handler: %o', error));
//     logger.info('Complete all Saving due today interest process completed');
// });

// cron that works every minute.
// schedule.scheduleJob('*/1 * * * *', async function () {
//     // await new SavingExpireCronHandler().run().catch((error) => logger.error('Wallet Handler: %o', error));
//     logger.info('Every minute cron job is running');
// });

// run at 12 noon everyday
// schedule.scheduleJob('0 12 * * *', async function () {
//     await new SavingExpireCronHandler().run().catch((error) => logger.error('Wallet Handler: %o', error));
//     logger.info('Every day at 12 noon cron job is running');
// });

schedule.scheduleJob('0 12 * * *', async function () {
    await new CleanUploadsHandler().run().catch((error) => logger.error('Clearing Uploadsrr', error));
    logger.info('Every day at 12 noon cron job is running');
});


schedule.scheduleJob('0 0 * * *', async function () {
    await new InterestCalculationHandler().run().catch((error) => logger.error('Interest Update Error', error));
    logger.info('Every day at 12 noon cron job is running');
});


logger.info('In-process Cron Jobs Registered!!!')



// 30:35:ad:d3:13:dc	
// 32:bf:0e:85:a8:cf	
// e0:27:6c:e6:f7:55
// ac:2d:a9:17:7a:8a
// 2c:26:17:1e:f6:ed	