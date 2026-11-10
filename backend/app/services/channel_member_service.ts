import ChannelException from '#exceptions/channel_exception'
import Channel from '#models/channel'
import User from '#models/user'
import ChannelService, { type QueryClient } from '#services/channel_service'
import RealtimeService from '#services/realtime_service'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'

export type MemberPayload = {
  nickName: string
  role: 'admin' | 'member'
  joinedAt: Date
}

export type KickResult = {
  nickName: string
  votes: number
  required: number
  banned: boolean
}

@inject()
export default class ChannelMemberService {
  constructor(
    protected channels: ChannelService,
    protected realtime: RealtimeService
  ) {}

  /**
   * `/list`: members of a channel the user belongs to, admin first.
   */
  async list(user: User, name: string): Promise<MemberPayload[]> {
    await this.channels.purgeInactive()
    const channel = await this.channels.findForMember(user, name)

    const rows = await db
      .from('channel_members')
      .join('users', 'users.id', 'channel_members.user_id')
      .where('channel_members.channel_id', channel.id)
      .orderByRaw('(users.id = ?) DESC', [channel.adminId])
      .orderBy('users.nick_name')
      .select('users.id', 'users.nick_name as nickName', 'channel_members.joined_at as joinedAt')

    return rows.map((row) => ({
      nickName: row.nickName,
      role: row.id === channel.adminId ? 'admin' : 'member',
      joinedAt: row.joinedAt,
    }))
  }

  /**
   * `/invite nickName`
   * - private channel: only the admin can invite
   * - public channel: any member can invite
   * - a banned user can only be let back in by the admin (this lifts the ban)
   */
  async invite(user: User, name: string, nickName: string) {
    await this.channels.purgeInactive()
    const channel = await this.channels.findForMember(user, name)
    const isAdmin = channel.adminId === user.id

    if (channel.type === 'private' && !isAdmin) throw ChannelException.adminOnlyInvite(name)

    const target = await this.findUser(nickName)
    const createdAt = new Date()

    const restored = await db.transaction(async (trx) => {
      if (await this.channels.isMember(trx, channel.id, target.id)) {
        throw ChannelException.alreadyMember(target.nickName, channel.name)
      }
      if (await this.channels.hasInvitation(trx, channel.id, target.id)) {
        throw ChannelException.alreadyInvited(target.nickName, channel.name)
      }

      const banned = await this.channels.isBanned(trx, channel.id, target.id)
      if (banned && !isAdmin) throw ChannelException.targetBanned(target.nickName, channel.name)
      if (banned) await this.unban(trx, channel.id, target.id)

      await trx
        .table('channel_invitations')
        .insert({
          channel_id: channel.id,
          user_id: target.id,
          invited_by_id: user.id,
          created_at: createdAt,
        })
        .onConflict(['channel_id', 'user_id'])
        .ignore()

      return banned
    })

    this.realtime.toUsers([target.nickName], {
      type: 'invitation.created',
      invitation: {
        channelName: channel.name,
        type: channel.type,
        invitedBy: user.nickName,
        createdAt: createdAt.toISOString(),
      },
    })

    return { nickName: target.nickName, restored }
  }

  /**
   * `/revoke nickName`: the admin removes a member (or a pending invitation)
   * from a private channel.
   */
  async revoke(user: User, name: string, nickName: string) {
    await this.channels.purgeInactive()
    const channel = await this.channels.findForMember(user, name)

    if (channel.type !== 'private') throw ChannelException.revokePublic(name)
    if (channel.adminId !== user.id) throw ChannelException.adminOnlyRemove(name)

    const target = await this.findUser(nickName)
    if (target.id === user.id) throw ChannelException.revokeSelf(name)

    const wasMember = await db.transaction(async (trx) => {
      const member = await this.channels.isMember(trx, channel.id, target.id)
      const invited = await this.channels.hasInvitation(trx, channel.id, target.id)
      if (!member && !invited) throw ChannelException.notInChannel(target.nickName, channel.name)

      await trx
        .from('channel_members')
        .where({ channel_id: channel.id, user_id: target.id })
        .delete()
      await this.channels.removeInvitation(trx, channel.id, target.id)

      return member
    })

    this.realtime.toUsers([target.nickName], {
      type: 'channel.removed',
      channelName: channel.name,
      reason: 'revoked',
    })
    if (wasMember) await this.realtime.publishMembersChanged(channel.id, channel.name)
  }

  /**
   * `/kick nickName`
   * - the admin bans the member permanently, in any channel
   * - in a public channel a member casts a vote; at 3 votes the member is banned
   * - in a private channel only the admin can kick
   */
  async kick(user: User, name: string, nickName: string): Promise<KickResult> {
    await this.channels.purgeInactive()
    const channel = await this.channels.findForMember(user, name)
    const isAdmin = channel.adminId === user.id

    const target = await this.findUser(nickName)
    if (target.id === user.id) throw ChannelException.kickSelf()
    if (target.id === channel.adminId) throw ChannelException.kickAdmin(target.nickName, name)
    if (!isAdmin && channel.type === 'private') throw ChannelException.adminOnlyRemove(name)

    const required = Channel.kickVotesToBan

    const result = await db.transaction(async (trx) => {
      // Lock the target's membership row so concurrent votes are counted one by one.
      const membership = await trx
        .from('channel_members')
        .where({ channel_id: channel.id, user_id: target.id })
        .forUpdate()
        .first()
      if (!membership) throw ChannelException.notInChannel(target.nickName, channel.name)

      if (isAdmin) {
        await this.ban(trx, channel.id, target.id)
        return { votes: required, banned: true }
      }

      const inserted = await trx
        .table('channel_kick_votes')
        .insert({
          channel_id: channel.id,
          target_id: target.id,
          voter_id: user.id,
          created_at: new Date(),
        })
        .onConflict(['channel_id', 'target_id', 'voter_id'])
        .ignore()
        .returning('voter_id')

      const votes = await this.countVotes(trx, channel.id, target.id)
      if (inserted.length === 0)
        throw ChannelException.alreadyVoted(target.nickName, votes, required)

      if (votes >= required) await this.ban(trx, channel.id, target.id)
      return { votes, banned: votes >= required }
    })

    if (result.banned) {
      this.realtime.toUsers([target.nickName], {
        type: 'channel.removed',
        channelName: channel.name,
        reason: 'banned',
      })
      await this.realtime.publishMembersChanged(channel.id, channel.name)
    }

    return { nickName: target.nickName, required, ...result }
  }

  private async findUser(nickName: string) {
    const target = await User.findBy('nickName', nickName.toLowerCase())
    if (!target) throw ChannelException.userNotFound(nickName)
    return target
  }

  private async countVotes(client: QueryClient, channelId: number, targetId: number) {
    const row = await client
      .from('channel_kick_votes')
      .where({ channel_id: channelId, target_id: targetId })
      .count('* as total')
      .first()

    return Number(row?.total ?? 0)
  }

  private async ban(client: QueryClient, channelId: number, userId: number) {
    await client.from('channel_members').where({ channel_id: channelId, user_id: userId }).delete()
    await this.channels.removeInvitation(client, channelId, userId)
    await client
      .from('channel_kick_votes')
      .where({ channel_id: channelId, target_id: userId })
      .delete()
    await client
      .table('channel_bans')
      .insert({ channel_id: channelId, user_id: userId, created_at: new Date() })
      .onConflict(['channel_id', 'user_id'])
      .ignore()
  }

  private async unban(client: QueryClient, channelId: number, userId: number) {
    await client.from('channel_bans').where({ channel_id: channelId, user_id: userId }).delete()
    await client
      .from('channel_kick_votes')
      .where({ channel_id: channelId, target_id: userId })
      .delete()
  }
}
