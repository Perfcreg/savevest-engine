import vine from '@vinejs/vine'

/**
 * Validates the Auth's registration action
 */
export const registerValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim(),
    lastName: vine.string().trim(),
    email: vine.string().email(),
    password: vine
      .string()
      .minLength(8)
      .maxLength(32),
    phone: vine.string().mobile({
        locale: ['en-NG']
    }).maxLength((15)),
    referal: vine.string().nullable()
  })
)



/**
 * Validates the Auth's login action
 */

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine
      .string()
      .minLength(8)
      .maxLength(32)
  })
)

export const verifyTokenValidator = vine.compile(
  vine.object({
    token: vine
      .string()
      .minLength(3)
      .maxLength(4)
  })
)

export const forgetPasswordValidator = vine.compile(
  vine.object({
    phoneNumber: vine.string().mobile({
      locale: ['en-NG']
    }).maxLength(15),
  })
)

export const resetPasswordalidator = vine.compile(
  vine.object({
    password: vine
      .string()
      .minLength(8)
      .maxLength(32)
      .confirmed({
        confirmationField : 'confirmation_password',
      }),
      confirmation_password: vine
      .string()
      .minLength(8)
      .maxLength(32)
  })
)

