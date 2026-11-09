import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'

export type MessagePayload = {
  id: number
  channelName: string
  author: string
  text: string
  createdAt: string
}

export function userChannel(nickName: string) {
  return `users/${nickName}`
}

export default class RealtimeService {
  async publishMessage(channelId: number, message: MessagePayload) {
    const members = await db
      .from('channel_members')
      .join('users', 'users.id', 'channel_members.user_id')
      .where('channel_members.channel_id', channelId)
      .select('users.nick_name as nickName')

    for (const member of members) {
      transmit.broadcast(userChannel(member.nickName), { type: 'message.created', message })
    }
  }
}
