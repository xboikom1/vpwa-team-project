import { MessageSchema } from '#database/schema'
import Channel from '#models/channel'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Message extends MessageSchema {
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare author: BelongsTo<typeof User>
}
