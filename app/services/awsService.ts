import aws, { S3 } from 'aws-sdk'
import env from '#start/env'


class S3Service {
  private s3: S3
  constructor() {
    this.s3 = new aws.S3()
  }

  async uploadImageToS3(file: any, fileName: string): Promise<string> {
    const params: S3.Types.PutObjectRequest = {
      Bucket: env.get('AWS_S3_BUCKET') || '',
      Key: fileName,
      Body: file,
      ACL: 'public-read'
    }

    try {
      const result = await this.s3.upload(params).promise()
      return result.Location
    } catch (error) {
      throw new Error(`Error uploading image to S3: ${error.message}`)
    }
  }
}

export default S3Service
