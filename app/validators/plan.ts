import vine from '@vinejs/vine'


/**
 * Validates the Auth's registration action
 */
export const createValidator = vine.compile(
    vine.object({
      name: vine.string(),
      description: vine.string(),
      amount: vine.number(),
      plan_type: vine.enum(['SAVING', 'AJO', 'PERSONAL', 'GROUP']),
      target_amount: vine.number(),
      interval: vine.string(),
      start_date: vine.date(),
      end_date: vine.date(),
    })
  )

  export type PlanCreateValidator = typeof createValidator[];