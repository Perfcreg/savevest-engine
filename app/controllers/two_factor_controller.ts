import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { verifyTwoFactorValidator } from '#validators/two_factor'

export default class TwoFactorController {
  async verify({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(verifyTwoFactorValidator)
      const { pin, userId } = data
      
      const user = await User.findOrFail(userId)
      
      if (user.pin !== pin) {
        return response.status(401).json({
          statusCode: 401,
          status: 'error',
          message: 'Invalid PIN',
        })
      }

      return response.json({
        statusCode: 200,
        status: 'success',
        message: '2FA verification successful',
      })
    } catch (error) {
      return response.status(500).json({
        statusCode: 500,
        status: 'error',
        message: 'Failed to verify PIN',
      })
    }
  }

  async toggle({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { enabled } = request.body()

      if(enabled && !user.pin){
        return response.status(400).json({
          statusCode: 400,
          status: 'error',
          message: 'PIN is not set',
        })
      }
      user.fa = enabled
      await user.save()

      return response.json({
        statusCode: 200,
        status: 'success',
        message: `2FA has been ${enabled ? 'enabled' : 'disabled'}`,
      })
    } catch (error) {
      return response.status(500).json({
        statusCode: 500,
        status: 'error',
        message: 'Failed to update 2FA settings',
      })
    }
  }

  
}