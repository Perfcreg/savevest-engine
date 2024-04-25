import twilio from 'twilio';
import env from '#start/env'

class SmsService {
    private client: twilio.Twilio;
  constructor() {
    this.client = twilio(env.get('TWILIO_ACCOUNT_SID'), env.get('TWILIO_AUTH_TOKEN'));
  }

  async sendResetPasswordSMS(phoneNumber: any, resetCode: any) {
    try {
      await this.client.messages.create({
        body: `Your reset password code is: ${resetCode}`,
        from: env.get('TWILIO_PHONE_NUMBER'),
        to: phoneNumber
      });
    } catch (error) {
      console.error('Error sending reset password SMS:', error);
      throw new Error('Failed to send reset password SMS');
    }
  }

  async sendTokenVerificationSMS(phoneNumber: any, verificationCode: any) {
    try {
      await this.client.messages.create({
        body: `Your savest verification code is: ${verificationCode}`,
        from: env.get('TWILIO_PHONE_NUMBER'),
        to: phoneNumber
      });
    } catch (error) {
      console.error('Error sending token verification SMS:', error);
      throw new Error('Failed to send token verification SMS');
    }
  }

  async sendTransactionalSMS(phoneNumber: any, message: any) {
    try {
      await this.client.messages.create({
        body: message,
        from: env.get('TWILIO_PHONE_NUMBER'),
        to: phoneNumber
      });
    } catch (error) {
      console.error('Error sending transactional SMS:', error);
      throw new Error('Failed to send transactional SMS');
    }
  }

  async sendBulkSMS(phoneNumbers: string[], message: string): Promise<void> {
    try {
      const promises = phoneNumbers.map(async (phoneNumber) => {
        await this.client.messages.create({
          body: message,
          from: env.get('TWILIO_PHONE_NUMBER'),
          to: phoneNumber
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      throw new Error('Failed to send bulk SMS');
    }
  }
}

export default SmsService;
