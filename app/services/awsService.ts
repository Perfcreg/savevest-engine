
import env from '#start/env'
import AWS from 'aws-sdk';


AWS.config.update({
  accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
    region: env.get('AWS_REGION'),
});
// Initialize AWS services with credentials and region from environment variables
const s3 = new AWS.S3();

const sns = new AWS.SNS();

const ses = new AWS.SES();

interface FileUpload {
    name: string;
    content: Buffer | Uint8Array | Blob | string;
    contentType: string;
}

interface Notification {
    message: string;
    subject: string;
}

interface Email {
    to: string;
    subject: string;
    body: string;
}

/**
 * Upload a file to S3
 * @param file - The file to upload
 * @returns The S3 upload response
 */
export const uploadToS3 = async (file: FileUpload) => {
  const params = {
    Bucket: env.get('AWS_S3_BUCKET'),
    Key: file.name,
    Body: file.content,
    ContentType: file.contentType,
 };

  try {
    const data = await s3.upload(params).promise();
    return data;
  } catch (error) {
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};
/**
 * Send a notification via SNS
 * @param notification - The notification to send
 * @returns The SNS publish response
 */
export const sendNotification = async (topicArn: string, message: string) => {
  const params = {
    TopicArn: topicArn,
    Message: message,
  };

  try {
    const data = await sns.publish(params).promise();
    return data;
  } catch (error) {
    throw new Error(`Failed to send notification: ${error.message}`);
  }
};

/**
 * Send an email via SES
 * @param email - The email to send
 * @returns The SES send email response
 */
export const sendEmail = async (to: string, subject: string, body: string) => {
  const params = {
    Source: process.env.AWS_SES_FROM_EMAIL!,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Text: {
          Data: body,
        },
      },
    },
  };

  try {
    const data = await ses.sendEmail(params).promise();
    return data;
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
