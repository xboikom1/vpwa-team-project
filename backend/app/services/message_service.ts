import Message from '#models/message'
import type User from '#models/user'
import ChannelService from '#services/channel_service'
import RealtimeService, { type MessagePayload } from '#services/realtime_service'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export const DEFAULT_PAGE_SIZE = 50

function toPayload(message: Message, channelName: string): MessagePayload {
  return {
    id: message.id,
    channelName,
    author: message.author.nickName,
    text: message.content,
    createdAt: message.createdAt.toISO()!,
  }
}

@inject()
export default class MessageService {
  constructor(
    protected channels: ChannelService,
    protected realtime: RealtimeService
  ) {}

  async list(user: User, name: string, options: { before?: number; limit?: number }) {
    await this.channels.purgeInactive()
    const channel = await this.channels.findForMember(user, name)
    const limit = options.limit ?? DEFAULT_PAGE_SIZE

    const query = Message.query()
      .where('channelId', channel.id)
      .preload('author')
      .orderBy('id', 'desc')
      .limit(limit + 1)
    if (options.before !== undefined) query.where('id', '<', options.before)

    const rows = await query
    const page = rows.slice(0, limit).reverse()

    return {
      messages: page.map((message) => toPayload(message, channel.name)),
      hasMore: rows.length > limit,
    }
  }

  async create(user: User, name: string, text: string) {
    await this.channels.purgeInactive()
    const channel = await this.channels.findForMember(user, name)
    const now = DateTime.now()

    const message = await db.transaction(async (trx) => {
      const created = await Message.create(
        { channelId: channel.id, userId: user.id, content: text, createdAt: now },
        { client: trx }
      )

      channel.useTransaction(trx)
      channel.lastMessageAt = now
      await channel.save()

      await trx
        .from('channel_members')
        .where({ channel_id: channel.id, user_id: user.id })
        .update({ last_read_at: now.toJSDate() })

      return created
    })

    message.$setRelated('author', user)
    const payload = toPayload(message, channel.name)
    await this.realtime.publishMessage(channel.id, payload)

    return payload
  }

  async markRead(user: User, name: string) {
    await this.channels.purgeInactive()
    const channel = await this.channels.findForMember(user, name)

    await db
      .from('channel_members')
      .where({ channel_id: channel.id, user_id: user.id })
      .update({ last_read_at: new Date() })
  }
}
