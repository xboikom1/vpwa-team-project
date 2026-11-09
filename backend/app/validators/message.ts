import vine from '@vinejs/vine'

export const sendMessageValidator = vine.create({
  text: vine.string().trim().minLength(1).maxLength(1000),
})

export const listMessagesValidator = vine.create({
  before: vine.number().withoutDecimals().positive().optional(),
  limit: vine.number().withoutDecimals().min(1).max(100).optional(),
})
