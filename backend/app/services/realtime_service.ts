import type User from '#models/user'
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

export type TypingPayload = {
  channelName: string
  nickName: string
  text: string
}

export type ChannelRemovalReason = 'deleted' | 'revoked' | 'banned'

export type UserStatus = User['status']

export type RealtimeEvent =
  | { type: 'message.created'; message: MessagePayload }
  | { type: 'invitation.created'; invitation: InvitationPayload }
  | { type: 'channel.removed'; channelName: string; reason: ChannelRemovalReason }
  | { type: 'members.changed'; channelName: string }
  | { type: 'user.status'; nickName: string; status: UserStatus }
  | ({ type: 'typing' } & TypingPayload)

export function userChannel(nickName: string) {
  return `users/${nickName}`
}

export default class RealtimeService {
  async memberNickNames(channelId: number): Promise<string[]> {
    const members = await db
      .from('channel_members')
      .join('users', 'users.id', 'channel_members.user_id')
      .where('channel_members.channel_id', channelId)
      .select('users.nick_name as nickName')

    return members.map((member) => member.nickName)
  }

  async reachableMemberNickNames(channelId: number): Promise<string[]> {
    const members = await db
      .from('channel_members')
      .join('users', 'users.id', 'channel_members.user_id')
      .where('channel_members.channel_id', channelId)
      .whereNot('users.status', 'offline')
      .select('users.nick_name as nickName')

    return members.map((member) => member.nickName)
  }

  async contactNickNames(userId: number): Promise<string[]> {
    const contacts = await db
      .from('channel_members as mine')
      .join('channel_members as others', 'others.channel_id', 'mine.channel_id')
      .join('users', 'users.id', 'others.user_id')
      .where('mine.user_id', userId)
      .distinct('users.nick_name as nickName')

    return contacts.map((contact) => contact.nickName)
  }

  async inviteeNickNames(channelId: number): Promise<string[]> {
    const invitees = await db
      .from('channel_invitations')
      .join('users', 'users.id', 'channel_invitations.user_id')
      .where('channel_invitations.channel_id', channelId)
      .select('users.nick_name as nickName')

    return invitees.map((invitee) => invitee.nickName)
  }

  toUsers(nickNames: readonly string[], event: RealtimeEvent) {
    for (const nickName of nickNames) {
      transmit.broadcast(userChannel(nickName), event)
    }
  }

  async toMembers(channelId: number, event: RealtimeEvent) {
    this.toUsers(await this.memberNickNames(channelId), event)
  }

  async publishMessage(channelId: number, message: MessagePayload) {
    this.toUsers(await this.reachableMemberNickNames(channelId), {
      type: 'message.created',
      message,
    })
  }

  async publishTyping(channelId: number, typing: TypingPayload) {
    const members = await this.reachableMemberNickNames(channelId)
    const audience = members.filter((nickName) => nickName !== typing.nickName)
    this.toUsers(audience, { type: 'typing', ...typing })
  }

  async publishStatus(user: User) {
    const contactNickNames = await this.contactNickNames(user.id)
    const audience = new Set([user.nickName, ...contactNickNames])
    this.toUsers([...audience], {
      type: 'user.status',
      nickName: user.nickName,
      status: user.status,
    })
  }

  async publishMembersChanged(channelId: number, channelName: string) {
    await this.toMembers(channelId, { type: 'members.changed', channelName })
  }
}
