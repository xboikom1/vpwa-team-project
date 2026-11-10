import { ChannelSchema } from '#database/schema'
import User from '#models/user'
import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Channel extends ChannelSchema {
  static inactiveAfterDays = 30
  static kickVotesToBan = 3

  @belongsTo(() => User, { foreignKey: 'adminId' })
  declare admin: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'channel_members',
    pivotTimestamps: { createdAt: 'joined_at', updatedAt: false },
    pivotColumns: ['last_read_at'],
  })
  declare members: ManyToMany<typeof User>
}
