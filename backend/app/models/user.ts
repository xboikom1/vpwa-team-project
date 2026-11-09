import { UserSchema } from '#database/schema'
import Channel from '#models/channel'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class User extends compose(
  UserSchema,
  withAuthFinder(hash, { uids: ['nickName', 'email'] })
) {
  static accessTokens = DbAccessTokensProvider.forModel(User, { expiresIn: '30 days' })
  declare currentAccessToken?: AccessToken

  @manyToMany(() => Channel, {
    pivotTable: 'channel_members',
    pivotTimestamps: { createdAt: 'joined_at', updatedAt: false },
    pivotColumns: ['last_read_at'],
  })
  declare channels: ManyToMany<typeof Channel>
}
