import vine from '@vinejs/vine'

export const verifyTwoFactorValidator = vine.compile(
  vine.object({
    pin: vine.string().trim().minLength(4).maxLength(4),
    userId: vine.number(),
  })
)

export const toggleTwoFactorValidator = vine.compile(
  vine.object({
    enabled: vine.boolean(),
  })
)