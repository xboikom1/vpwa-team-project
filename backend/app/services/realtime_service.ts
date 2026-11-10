import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'

export type MessagePayload = {
  id: number
  channelName: string
  author: string
  text: string
  createdAt: string
}

export type InvitationPayload = {
  channelName: string
  type: 'public' | 'private'
  invitedBy: string
  createdAt: string
}

export type ChannelRemovalReason = 'deleted' | 'revoked' | 'banned'

export type RealtimeEvent =
  | { type: 'message.created'; message: MessagePayload }
  | { type: 'invitation.created'; invitation: InvitationPayload }
  | { type: 'channel.removed'; channelName: string; reason: ChannelRemovalReason }
  | { type: 'members.changed'; channelName: string }

export function userChannel(nickName: string) {
  return `users/${nickName}`
}

export default class RealtimeService {
  async memberNicks(channelId: number): Promise<string[]> {
    const rows = await db
      .from('channel_members')
      .join('users', 'users.id', 'channel_members.user_id')
      .where('channel_members.channel_id', channelId)
      .select('users.nick_name as nickName')

    return rows.map((row) => row.nickName)
  }

  async inviteeNicks(channelId: number): Promise<string[]> {
    const rows = await db
      .from('channel_invitations')
      .join('users', 'users.id', 'channel_invitations.user_id')
      .where('channel_invitations.channel_id', channelId)
      .select('users.nick_name as nickName')

    return rows.map((row) => row.nickName)
  }

  toUsers(nickNames: readonly string[], event: RealtimeEvent) {
    for (const nickName of nickNames) {
      transmit.broadcast(userChannel(nickName), event)
    }
  }

  async toMembers(channelId: number, event: RealtimeEvent) {
    this.toUsers(await this.memberNicks(channelId), event)
  }

  async publishMessage(channelId: number, message: MessagePayload) {
    await this.toMembers(channelId, { type: 'message.created', message })
  }

  async publishMembersChanged(channelId: number, channelName: string) {
    await this.toMembers(channelId, { type: 'members.changed', channelName })
  }
}
