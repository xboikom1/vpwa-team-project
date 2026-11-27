import ChannelException from '#exceptions/channel_exception'
import Channel from '#models/channel'
import type User from '#models/user'
import RealtimeService from '#services/realtime_service'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

type ChannelType = Channel['type']
type Role = 'admin' | 'member'

export type QueryClient = Pick<TransactionClientContract, 'from' | 'table'>

export interface PendingInvitation {
  channelName: string
  type: ChannelType
  invitedBy: string
  createdAt: Date
}

function withRole(channel: Channel, role: Role): Channel {
  channel.$extras.role = role
  return channel
}

@inject()
export default class ChannelService {
  constructor(protected realtime: RealtimeService) {}

  async purgeInactive() {
    const limit = DateTime.now().minus({ days: Channel.inactiveAfterDays })
    await Channel.query().where('lastMessageAt', '<', limit.toJSDate()).delete()
  }

  async list(user: User) {
    await this.purgeInactive()

    return user
      .related('channels')
      .query()
      .select(
        'channels.*',
        db.raw("CASE WHEN channels.admin_id = ? THEN 'admin' ELSE 'member' END AS role", [user.id]),
        db.raw(
          `(SELECT count(*)::int FROM messages
            WHERE messages.channel_id = channels.id
              AND messages.user_id <> ?
              AND messages.created_at > channel_members.last_read_at) AS unread`,
          [user.id]
        )
      )
      .orderBy('channels.name')
  }

  async create(user: User, name: string, type: ChannelType) {
    await this.purgeInactive()

    return db.transaction(async (trx) => {
      const taken = await Channel.query({ client: trx }).where('name', name).first()
      if (taken) throw ChannelException.nameTaken()

      return this.createRow(trx, user, name, type)
    })
  }

  async join(user: User, name: string, type: ChannelType) {
    await this.purgeInactive()

    const result = await db.transaction(async (trx) => {
      const existingChannel = await Channel.query({ client: trx }).where('name', name).first()

      if (!existingChannel) {
        const newChannel = await this.createRow(trx, user, name, type)
        return { channel: newChannel, created: true, joined: true }
      }

      const isAlreadyMember = await this.isMember(trx, existingChannel.id, user.id)

      if (isAlreadyMember) {
        return {
          channel: withRole(existingChannel, this.roleOf(existingChannel, user)),
          created: false,
          joined: false,
        }
      }

      const isBanned = await this.isBanned(trx, existingChannel.id, user.id)
      if (isBanned) throw ChannelException.banned(name)

      const hasInvitation = await this.hasInvitation(trx, existingChannel.id, user.id)
      if (existingChannel.type === 'private' && !hasInvitation) {
        throw ChannelException.privateChannel(name)
      }

      await this.removeInvitation(trx, existingChannel.id, user.id)
      await this.addMember(trx, existingChannel.id, user.id)

      return { channel: withRole(existingChannel, 'member'), created: false, joined: true }
    })

    if (result.joined && !result.created) {
      await this.realtime.publishMembersChanged(result.channel.id, result.channel.name)
    }

    return result
  }

  async destroy(user: User, name: string) {
    await this.purgeInactive()

    const channel = await this.findForMember(user, name)
    if (channel.adminId !== user.id) throw ChannelException.notAdmin(name)

    await this.deleteChannel(channel, user)
  }

  async leave(user: User, name: string) {
    await this.purgeInactive()

    const channel = await this.findForMember(user, name)
    if (channel.adminId === user.id) {
      await this.deleteChannel(channel, user)
      return
    }

    await channel.related('members').detach([user.id])
    await this.realtime.publishMembersChanged(channel.id, channel.name)
  }

  async invitations(user: User): Promise<PendingInvitation[]> {
    await this.purgeInactive()

    return db
      .from('channel_invitations')
      .join('channels', 'channels.id', 'channel_invitations.channel_id')
      .join('users as inviter', 'inviter.id', 'channel_invitations.invited_by_id')
      .where('channel_invitations.user_id', user.id)
      .orderBy('channel_invitations.created_at', 'desc')
      .select(
        'channels.name as channelName',
        'channels.type as type',
        'inviter.nick_name as invitedBy',
        'channel_invitations.created_at as createdAt'
      )
  }

  async acceptInvitation(user: User, name: string) {
    await this.purgeInactive()

    const channel = await db.transaction(async (trx) => {
      const invitedChannel = await Channel.query({ client: trx }).where('name', name).first()
      if (!invitedChannel) throw ChannelException.invalidInvitation(name)

      const hasInvitation = await this.hasInvitation(trx, invitedChannel.id, user.id)
      if (!hasInvitation) throw ChannelException.invalidInvitation(name)

      const isBanned = await this.isBanned(trx, invitedChannel.id, user.id)
      if (isBanned) throw ChannelException.banned(name)

      await this.removeInvitation(trx, invitedChannel.id, user.id)
      await this.addMember(trx, invitedChannel.id, user.id)
      return invitedChannel
    })

    await this.realtime.publishMembersChanged(channel.id, channel.name)
  }

  async declineInvitation(user: User, name: string) {
    const channel = await Channel.findBy('name', name)
    if (!channel) return

    await this.removeInvitation(db, channel.id, user.id)
  }

  async findForMember(user: User, name: string) {
    const channel = await Channel.findBy('name', name)
    if (!channel) throw ChannelException.notMember(name)

    if (!(await this.isMember(db, channel.id, user.id))) throw ChannelException.notMember(name)

    return channel
  }

  async isMember(client: QueryClient, channelId: number, userId: number) {
    const row = await client
      .from('channel_members')
      .where({ channel_id: channelId, user_id: userId })
      .first()

    return row !== null
  }

  async isBanned(client: QueryClient, channelId: number, userId: number) {
    const row = await client
      .from('channel_bans')
      .where({ channel_id: channelId, user_id: userId })
      .first()

    return row !== null
  }

  async hasInvitation(client: QueryClient, channelId: number, userId: number) {
    const row = await client
      .from('channel_invitations')
      .where({ channel_id: channelId, user_id: userId })
      .first()

    return row !== null
  }

  async removeInvitation(client: QueryClient, channelId: number, userId: number) {
    await client
      .from('channel_invitations')
      .where({ channel_id: channelId, user_id: userId })
      .delete()
  }

  private roleOf(channel: Channel, user: User): Role {
    return channel.adminId === user.id ? 'admin' : 'member'
  }

  private async deleteChannel(channel: Channel, actor: User) {
    const memberNickNames = await this.realtime.memberNickNames(channel.id)
    const inviteeNickNames = await this.realtime.inviteeNickNames(channel.id)

    const allNickNames = [...memberNickNames, ...inviteeNickNames]
    const recipientNickNames = allNickNames.filter((nickName) => nickName !== actor.nickName)

    await channel.delete()

    this.realtime.toUsers(recipientNickNames, {
      type: 'channel.removed',
      channelName: channel.name,
      reason: 'deleted',
    })
  }

  private async createRow(
    trx: TransactionClientContract,
    user: User,
    name: string,
    type: ChannelType
  ) {
    const channel = await Channel.create(
      { name, type, adminId: user.id, lastMessageAt: DateTime.now() },
      { client: trx }
    )
    await this.addMember(trx, channel.id, user.id)

    return withRole(channel, 'admin')
  }

  private async addMember(trx: TransactionClientContract, channelId: number, userId: number) {
    const now = new Date()
    await trx
      .table('channel_members')
      .insert({ channel_id: channelId, user_id: userId, joined_at: now, last_read_at: now })
  }
}
