/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AutoSwagger from "adonis-autoswagger";
import swagger from "#config/swagger";
import { apiThrottle } from '#start/limiter'
import { middleware } from '#start/kernel'
// import { isAdmin } from '#abilities/main';
const UsersController = () => import('#controllers/users_controller');
const AuthController = () => import('#controllers/auth_controller')
const PlanController = () => import('#controllers/plans_controller')
const CardController = () => import('#controllers/user_cards_controller')
const WalletController = () => import('#controllers/wallets_controller')
const BankController = () => import('#controllers/user_banks_controller')
const AdminController = () => import('#controllers/admin_controller')

const NotificationController = () => import('#controllers/notificationController')





router.get('/', ({ request, response }) => {
  console.log(request.headers())
  console.log(request.qs())
  response.send('hello world')
  response.send({ hello: 'world' })
})


router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.put('verify', [AuthController, 'verifyPhone'])
    router.put('verify-reset', [AuthController, 'verifyReset'])
    router.post('verify-2fa', [AuthController, 'verify2fa'])
    router.put('forget-password', [AuthController, 'forgetPassword'])
    router.put('reset-password', [AuthController, 'resetPassword'])
    router.post('check-password', [AuthController, 'checkPassword'])
    router.post('logout', [AuthController, 'logout'])
  })
  .prefix('/api/auth')
  .use(apiThrottle)

router
  .group(() => {
    router.get('/users', [AdminController, 'getUserList'])
    router.post('/users', [AdminController, 'createUser'])
    router.put('/users/:userId/ban', [AdminController, 'banUser'])
    router.get('/withdrawals', [AdminController, 'checkWithdrawals'])
    router.get('/analytics/daily', [AdminController, 'getDailyAnalytics'])
    router.get('/analytics/monthly', [AdminController, 'getMonthlyAnalytics'])
    router.get('/dashboard-data', [AdminController, 'getDashboardData'])
  })
  .prefix('/api/admin')
  .use(middleware.auth())
  .use(middleware.isAdmin())
  .use(apiThrottle)



router
  .group(() => {
    router.post('/paystack', [WalletController, 'handlePaystackWebhook'])
  })
  .prefix('/api')

router.group(() => {
  router.get('/', [UsersController, 'get']);
  router.put('update-profile', [UsersController, 'updateProfile']);
  router.put('update-password', [UsersController, 'updatePassword']);
  router.put('to', [UsersController, 'updatePassword']);

  router.post('bvn', [UsersController, 'updateKyc']);
  router.post('pin', [UsersController, 'createPin']);
  router.put('pin', [UsersController, 'updatePin']);

  router.post('verify-pin', [UsersController, 'verifyPin']);
  router.post('withdrawal', [WalletController, 'createWithdrawal']);
  router.post('complete-withdrawal', [WalletController, 'completeTransfer']);
  router.post('upload-image', [UsersController, 'uploadPhoto']);
  router.put('kin', [UsersController, 'updateKin']);
  router.put('push-token', [NotificationController, 'updateDeviceId']);
  router.put('create-dva', [WalletController, 'createDVA']);
  router.post('verify-2fa', '#controllers/two_factor_controller.verify')
  router.put('toggle-2fa', '#controllers/two_factor_controller.toggle')
   
}).prefix('/api/user')
  .use(apiThrottle)
  .use(middleware.auth())



router
  .group(() => {
    router.get('/', [CardController, 'getCards'])
    router.post('/add-card', [CardController, 'addCard'])
    router.get('/transactions', [CardController, 'getCardTransactions'])
    router.put('/:id', [CardController, 'updateCard'])
    router.delete('/:id', [CardController, 'deleteCard'])
    router.post('/submit-pin', [CardController, 'submitPin'])
  })
  .prefix('/api/user/card')
  .use(middleware.auth())
  .use(apiThrottle)

router
  .group(() => {
    router.get('/', [BankController, 'get'])
    router.post('/', [BankController, 'addBank'])
    router.delete('/:id', [BankController, 'deleteBank'])
  })
  .prefix('/api/user/bank')
  .use(middleware.auth())
  .use(apiThrottle)



router
  .group(() => {
    router.post('create', [PlanController, 'create']);
    router.get('/', [PlanController, 'getUsersPlan']);
    router.get('/type', [PlanController, 'getPlanType'])
    router.get('/:plan_id', [PlanController, 'getPlanSubscribers'])
    router.post('subscribe/:plan_code', [PlanController, 'joinPlan'])
    router.put('unsubscribe/:plan_code', [PlanController, 'cancelSubscription'])
    router.get('getplan/:plan_code', [PlanController, 'getPlan'])
    router.post('/:id/invite', [PlanController, 'inviteMember'])
    router.put('/:id/lock', [PlanController, 'lockSavings'])
    router.put('/:id/break', [PlanController, 'cancelSubscription'])
    router.get('/:id/transactions', [PlanController, 'getCustomerTransactions'])
  })
  .prefix('/api/user/plan')
  .use(apiThrottle)
  .use(middleware.auth());



router
  .group(() => {
    router.get('/', [PlanController, 'index']);
    router.get('/:plan_code', [PlanController, 'getPlan']);
  })
  .prefix('/api/admin/plan')
  .use(apiThrottle)
  .use(middleware.auth())
// .use(isAdmin)




router
  .group(() => {
    router.get('/', [WalletController, 'show'])
    router.get('transactions', [WalletController, 'fetchWalletTransactions'])
  })
  .prefix('/api/user/wallet')
  .use(apiThrottle)
  .use(middleware.auth())


router.get("/swagger", async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger);
});

// Renders Swagger-UI and passes YAML-output of /swagger
router.get("/docs", async () => {
  return AutoSwagger.default.ui("/swagger", swagger);
  // return AutoSwagger.default.rapidoc("/swagger", swagger); to use RapiDoc instead
});



