import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const channelValidator = vine.create({
  name: vine
    .string()
    .trim()
    .toLowerCase()
    .minLength(1)
    .maxLength(30)
    .regex(/^[a-z0-9_-]+$/),
  type: vine.enum(['public', 'private'] as const),
})

channelValidator.messagesProvider = new SimpleMessagesProvider({
  'name.regex': 'Use only a-z, 0-9, - and _.',
})
