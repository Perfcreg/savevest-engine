import { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#services/notificationService'
import User from '#models/user'

export default class NotificationController {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }


  public async updateDeviceId({ auth, request, response }: HttpContext) {
    const { token } = request.only(['token'])
    try {
      const user = await auth.authenticate()
      user.deviceId = token
      user?.save()
      return response.status(200).json({ message: 'Device ID updated successfully' })
    } catch (error) {
      console.error('Error updating device ID:', error)
      return response.status(500).json({ error: 'Failed to update device ID' })
    }
  }

  public async sendReferralNotification({ request, response }: HttpContext) {
    const { userId, referrerName } = request.only(['userId', 'referrerName'])

    try {
      const user = await User.findOrFail(userId)
      await this.notificationService.sendReferralNotification(user, referrerName)
      return response.status(200).json({ message: 'Referral notification sent successfully' })
    } catch (error) {
      console.error('Error sending referral notification:', error)
      return response.status(500).json({ error: 'Failed to send referral notification' })
    }
  }

  public async sendNewSubscriberNotification({ request, response }: HttpContext) {
    const { userId, planName } = request.only(['userId', 'planName'])

    try {
      const user = await User.findOrFail(userId)
      await this.notificationService.sendNewSubscriberNotification(user, planName)
      return response.status(200).json({ message: 'New subscriber notification sent successfully' })
    } catch (error) {
      console.error('Error sending new subscriber notification:', error)
      return response.status(500).json({ error: 'Failed to send new subscriber notification' })
    }
  }

  public async sendDepositNotification({ request, response }: HttpContext) {
    const { userId, amount } = request.only(['userId', 'amount'])

    try {
      const user = await User.findOrFail(userId)
      await this.notificationService.sendDepositNotification(user, amount)
      return response.status(200).json({ message: 'Deposit notification sent successfully' })
    } catch (error) {
      console.error('Error sending deposit notification:', error)
      return response.status(500).json({ error: 'Failed to send deposit notification' })
    }
  }

  public async sendWithdrawalNotification({ request, response }: HttpContext) {
    const { userId, amount } = request.only(['userId', 'amount'])

    try {
      const user = await User.findOrFail(userId)
      await this.notificationService.sendWithdrawalNotification(user, amount)
      return response.status(200).json({ message: 'Withdrawal notification sent successfully' })
    } catch (error) {
      console.error('Error sending withdrawal notification:', error)
      return response.status(500).json({ error: 'Failed to send withdrawal notification' })
    }
  }
}