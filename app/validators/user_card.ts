import vine from '@vinejs/vine'


export const createCardValidator = vine.compile(
  vine.object({
    card_number: vine.string(),
    cvv: vine.string(),
    expiry_month: vine.string(),
    // expiry_year: vine.string(),
  })
);

export const updateCardValidator = vine.compile(
    vine.object({
        card_number: vine.string(),
        cvv: vine.string(),
        expiry_month: vine.string(),
        // expiry_year: vine.string(),
      })
);
