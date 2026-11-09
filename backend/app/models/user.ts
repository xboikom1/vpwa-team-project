import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

export default class User extends compose(
  UserSchema,
  withAuthFinder(hash, { uids: ['nickName', 'email'] })
) {
  static accessTokens = DbAccessTokensProvider.forModel(User, { expiresIn: '30 days' })
  declare currentAccessToken?: AccessToken
}
