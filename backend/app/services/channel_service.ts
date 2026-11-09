import ChannelException from '#exceptions/channel_exception'
import Channel from '#models/channel'
import type User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

type ChannelType = Channel['type']
type Role = 'admin' | 'member'

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

export default class ChannelService {
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
        db.raw("CASE WHEN channels.admin_id = ? THEN 'admin' ELSE 'member' END AS role", [user.id])
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

    return db.transaction(async (trx) => {
      const channel = await Channel.query({ client: trx }).where('name', name).first()
      if (!channel) return { channel: await this.createRow(trx, user, name, type), created: true }

      const isMember = await this.isMember(trx, channel.id, user.id)
      if (isMember) {
        return { channel: withRole(channel, this.roleOf(channel, user)), created: false }
      }

      const invitation = await trx
        .from('channel_invitations')
        .where({ channel_id: channel.id, user_id: user.id })
        .first()
      if (!invitation && channel.type === 'private') throw ChannelException.privateChannel(name)

      await this.removeInvitation(trx, channel.id, user.id)
      await this.addMember(trx, channel.id, user.id)

      return { channel: withRole(channel, 'member'), created: false }
    })
  }

  async destroy(user: User, name: string) {
    await this.purgeInactive()

    const channel = await this.findForMember(user, name)
    if (channel.adminId !== user.id) throw ChannelException.notAdmin(name)

    await channel.delete()
  }

  async leave(user: User, name: string) {
    await this.purgeInactive()

    const channel = await this.findForMember(user, name)
    if (channel.adminId === user.id) {
      await channel.delete()
      return
    }

    await channel.related('members').detach([user.id])
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

    await db.transaction(async (trx) => {
      const channel = await Channel.query({ client: trx }).where('name', name).first()
      const invitation = channel
        ? await trx
            .from('channel_invitations')
            .where({ channel_id: channel.id, user_id: user.id })
            .first()
        : null
      if (!channel || !invitation) throw ChannelException.invalidInvitation(name)

      await this.removeInvitation(trx, channel.id, user.id)
      await this.addMember(trx, channel.id, user.id)
    })
  }

  async declineInvitation(user: User, name: string) {
    const channel = await Channel.findBy('name', name)
    if (!channel) return

    await this.removeInvitation(db, channel.id, user.id)
  }

  private roleOf(channel: Channel, user: User): Role {
    return channel.adminId === user.id ? 'admin' : 'member'
  }

  private async isMember(trx: TransactionClientContract, channelId: number, userId: number) {
    const row = await trx
      .from('channel_members')
      .where({ channel_id: channelId, user_id: userId })
      .first()

    return row !== null
  }

  private async findForMember(user: User, name: string) {
    const channel = await Channel.findBy('name', name)
    if (!channel) throw ChannelException.notMember(name)

    const row = await db
      .from('channel_members')
      .where({ channel_id: channel.id, user_id: user.id })
      .first()
    if (!row) throw ChannelException.notMember(name)

    return channel
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

  private async removeInvitation(
    client: Pick<TransactionClientContract, 'from'>,
    channelId: number,
    userId: number
  ) {
    await client
      .from('channel_invitations')
      .where({ channel_id: channelId, user_id: userId })
      .delete()
  }
}
