import vine from '@vinejs/vine'


export const updatePasswordValidator = vine.compile(
  vine.object({
    newPassword: vine
      .string()
      .minLength(8)
      .maxLength(32),

    oldPassword: vine
      .string()
      .minLength(8)
      .maxLength(32)
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    gender: vine.enum(['male', 'female']),
    username: vine.string().trim().minLength(3).maxLength(30), // Username validation
    firstName: vine.string().trim().minLength(1).maxLength(25), // First name validation
    lastName: vine.string().trim().minLength(1).maxLength(25), // Last name validation
    dateOfBirth: vine.string(), // Date of birth validation
  }),
)

export const photoUploadValidator = vine.compile(
  vine.object({
    photo: vine.file({
      size: '10mb',
      extnames: ['jpg', 'jpeg']
    })
  })
);


export const updatePhoneNumberValidator = vine.compile(
  vine.object({
    phone_number: vine.string().mobile({
      locale: ['en-NG']
    }).maxLength(15),
  })
)


export const createPinValidator = vine.compile(
  vine.object({
    pin: vine
      .string()
      .maxLength(4),
    confirm_pin: vine
      .string()
      .maxLength(4)
      .sameAs('pin')
  })
)

export const verifyPinValidator = vine.compile(
  vine.object({
    pin: vine
      .string()
      .maxLength(4),
  })
)

export const updatePinValidator = vine.compile(
  vine.object({
    old_pin: vine
      .string()
      .maxLength(4),
    new_pin: vine
      .string()
      .maxLength(4)
  })
)

export const updateKinValidator = vine.compile(
  vine.object({
    kin: vine.string().trim()
  })
)
