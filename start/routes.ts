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
import { middleware } from '#start/kernel'
const UsersController = () => import('#controllers/users_controller');
const AuthController = () => import('#controllers/auth_controller')
const PlanController = () => import('#controllers/plans_controller')


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
  





  router.group(() => {
    router.get('/', [UsersController, 'get']).use([middleware.auth()]);
    router.put('update-profile', [UsersController, 'updateProfile']).use([middleware.auth()]);;
    router.put('update-password', [UsersController, 'updatePassword']).use([middleware.auth()]);;
    router.put('bvn', [UsersController, 'updateBvn']).use(middleware.auth());
    router.put('nin',[UsersController, 'updateNin']).use(middleware.auth());
    router.post('upload-image', [UsersController, 'uploadPhoto']).use(middleware.auth());
    router.put('2fa', [UsersController, 'update2fa']).use(middleware.auth());
    router.put('kin', [UsersController, 'updateKin']).use(middleware.auth());
  }).prefix('/api/user');
  

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


  router
  .group(() => {
    router.post('register', () => {
      
    })
    router.post('login', () => {

    })
    router.put('verify', () => {

    })

  })
  .prefix('/api/wallet')





router.get("/swagger", async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger);
});


// Renders Swagger-UI and passes YAML-output of /swagger
router.get("/docs", async () => {
  return AutoSwagger.default.ui("/swagger", swagger);
  // return AutoSwagger.default.rapidoc("/swagger", swagger); to use RapiDoc instead
});

