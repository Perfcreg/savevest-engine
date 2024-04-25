import vine from '@vinejs/vine'

export const bankValidator = vine.compile(
    vine.object({
      bank_code: vine.string(),
      account_number: vine.string(),
      bank_name: vine.string(),
    })
  );