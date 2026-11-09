import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const name = () => vine.string().trim().minLength(1).maxLength(40)
const email = () => vine.string().trim().toLowerCase().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(72)

export const registerValidator = vine.create({
  firstName: name(),
  lastName: name(),
  nickName: vine
    .string()
    .trim()
    .toLowerCase()
    .minLength(1)
    .maxLength(20)
    .regex(/^[a-z0-9_]+$/)
    .unique({ table: 'users', column: 'nick_name' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
})

registerValidator.messagesProvider = new SimpleMessagesProvider(
  {
    'nickName.database.unique': 'That nickname is taken. Pick another nickname.',
    'email.database.unique': 'That email already has an account. Sign in instead.',
    'nickName.regex': 'Use only a-z, 0-9 and _.',
  },
  {
    firstName: 'first name',
    lastName: 'last name',
    nickName: 'nickname',
  }
)

export const loginValidator = vine.create({
  identifier: vine.string().trim().minLength(1).maxLength(254),
  password: vine.string().minLength(1).maxLength(128),
})
