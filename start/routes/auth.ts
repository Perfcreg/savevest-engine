import router from '@adonisjs/core/services/router'
import { middleware } from '../kernel.js'

router.group(() => {
  router.post('verify-2fa', '#controllers/two_factor_controller.verify')
  router.post('2fa/toggle', '#controllers/two_factor_controller.toggle').use(
    middleware.auth()
  )
}).prefix('/api/auth')