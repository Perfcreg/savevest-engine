// EmailService.ts
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import handlebars from 'handlebars';
import env from '#start/env'

class EmailService {
  private defaultTemplatePath: string;

  constructor(defaultTemplatePath: string = 'default') {
    this.defaultTemplatePath = defaultTemplatePath;
    sgMail.setApiKey(env.get('SENDGRID_API_KEY') || '');
  }

  async sendEmail(to: string, subject: string, data: any, templatePath?: string) {
    try {
      const templateHtml = await this.loadTemplate(templatePath || this.defaultTemplatePath);
      const template = handlebars.compile(templateHtml);
      const html = template(data);

      const msg = {
        to,
        from: env.get('EMAIL_SENDER') || '',
        subject,
        html,
      };
      await sgMail.send(msg);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  private async loadTemplate(templatePath: string): Promise<string> {
    const filePath = `${__dirname}/../emails/${templatePath}.hbs`;
    return fs.readFileSync(filePath, 'utf8');
  }
}

export default EmailService;
