import { Expo } from 'expo-server-sdk';
import env from '#start/env'

class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({ accessToken: env.get('EXPO_ACCESS_TOKEN') });
  }

  async sendPushNotification(user: any, title: string, body: string, data: any = {}) {
    if (!user.deviceId || !Expo.isExpoPushToken(user.deviceId)) {
      console.error(`Device ID ${user.deviceId} is not a valid Expo push token`);
      return;
    }

    const message: any = {
      to: user.deviceId,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      await this.expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw new Error('Failed to send push notification');
    }
  }

  async sendReferralNotification(user: any, referrerName: string) {
    await this.sendPushNotification(
      user,
      'New Referral!',
      `${referrerName} just used your referral link!`,
      { type: 'referral' }
    );
  }

  async sendNewSubscriberNotification(user: any, planName: string) {
    await this.sendPushNotification(
      user,
      'New Subscriber!',
      `A new user has subscribed to your ${planName} plan!`,
      { type: 'new_subscriber' }
    );
  }

  async sendDepositNotification(user: any, amount: number) {
    await this.sendPushNotification(
      user,
      'Deposit Successful',
      `Your deposit of ${amount} has been successfully processed.`,
      { type: 'deposit' }
    );
  }

  async sendWithdrawalNotification(user: any, amount: number) {
    await this.sendPushNotification(
      user,
      'Withdrawal Successful',
      `Your withdrawal of ${amount} has been successfully processed.`,
      { type: 'withdrawal' }
    );
  }
}

export default NotificationService;