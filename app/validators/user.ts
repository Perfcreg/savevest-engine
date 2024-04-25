import vine from '@vinejs/vine'


export const updatePasswordValidator = vine.compile(
    vine.object({
      new_password: vine
        .string()
        .minLength(8)
        .maxLength(32),
      
        old_password: vine
        .string()
        .minLength(8)
        .maxLength(32)
    })
  )
  

  export const updatePhoneNumberValidator = vine.compile(
    vine.object({
        phone_number: vine.string().mobile({
            locale: ['en-NG']
          }).maxLength(15),
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
