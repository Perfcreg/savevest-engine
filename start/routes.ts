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
const UsersController = () => import('#controllers/users_controller');
const AuthController = () => import('#controllers/auth_controller')
const PlanController = () => import('#controllers/plans_controller')
const CardController = () => import('#controllers/user_cards_controller')
const WalletController = () => import('#controllers/wallets_controller')
const BankController = () => import('#controllers/user_banks_controller')





router.get('/', ({ request, response }) => {
  // console.log(request.url())
  console.log(request.headers())
  console.log(request.qs())
  // console.log(request.body())
  response.send('hello world')
  response.send({ hello: 'world' })
})


router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.put('verify', [AuthController, 'verifyPhone'])
    router.put('forget-password', [AuthController, 'forgetPassword'])
    router.put('reset-password', [AuthController, 'resetPassword'])
  })
  .prefix('/api/auth')
  // .use(apiThrottle)


  





  router.group(() => {
    router.get('/', [UsersController, 'get']).use([middleware.auth()]);
    router.put('update-profile', [UsersController, 'updateProfile']).use([middleware.auth()]);;
    router.put('update-password', [UsersController, 'updatePassword']).use([middleware.auth()]);;
    router.post('bvn', [UsersController, 'updateKyc']).use(middleware.auth());
    router.post('pin',[UsersController, 'createPin']).use(middleware.auth());
    router.post('verify-pin',[UsersController, 'verifyPin']).use(middleware.auth());

    router.post('upload-image', [UsersController, 'uploadPhoto']).use(middleware.auth());
    router.put('2fa', [UsersController, 'update2fa']).use(middleware.auth());
    router.put('kin', [UsersController, 'updateKin']).use(middleware.auth());
  }).prefix('/api/user')
  // .use(apiThrottle)


  router
  .group(() => {
    router.get('/', [CardController, 'getCards'])
    router.post('/add-card', [CardController, 'addCard'])
    router.get('/transactions', [CardController, 'getCardTransactions'])

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
    router.get('/', [PlanController, 'index']).use(middleware.auth());
    router.post('create', [PlanController, 'create']).use(middleware.auth());
    router.put('update', () => {

    })
    router.put('verify', () => {

    })

  })
  .prefix('/api/plan')
  .use(apiThrottle)



  router
  .group(() => {
    router.post('register', () => {
      
    })
    router.post('login', () => {

    })
    router.put('verify', () => {

    })

  })
  .prefix('/api/group-savings')
  .use(apiThrottle)



  router
  .group(() => {
    router.get('/', [WalletController, 'show'])
    router.get('transactions', [WalletController, 'fetchWalletTransactions'])

    router.post('login', () => {

    })
    router.put('verify', () => {

    })

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

