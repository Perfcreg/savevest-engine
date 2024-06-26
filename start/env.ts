/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  TWILIO_ACCOUNT_SID: Env.schema.string(),
  TWILIO_AUTH_TOKEN: Env.schema.string(),
  TWILIO_PHONE_NUMBER: Env.schema.string(),

  SENDGRID_API_KEY: Env.schema.string(),
  EMAIL_SENDER: Env.schema.string(),

  PAYSTACK_SECRET_KEY: Env.schema.string(),
  PAYSTACK_PUBLIC_KEY: Env.schema.string(),

  AWS_ACCESS_KEY_ID: Env.schema.string(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string(),
  AWS_REGION: Env.schema.string(),
  AWS_S3_BUCKET: Env.schema.string(),

  SMILE_ID_KEY: Env.schema.string(),
  SMILE_ID_PARTNER: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const)
})
