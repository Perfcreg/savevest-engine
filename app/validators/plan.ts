import vine from '@vinejs/vine'
// import { time } from 'node:console';


/**
 * Validates the Plan's Creation action
 */
export const createValidator = vine.compile(
    vine.object({
      name: vine.string(),
      description: vine.string(),
      amount: vine.number(),
      plan_id: vine.number(),
      time: vine.string(),
      plan_type: vine.enum(['SAVING', 'AJO', 'PERSONAL', 'GROUP']),
      target_amount: vine.number(),
      interest: vine.number(),
      interval: vine.string(),
      start_date: vine.date(),
      end_date: vine.date(),
    })
  )


  export const PlanSubscriberValidator = vine.compile(
    vine.object({
      plan_code: vine.string(),
    })
  )