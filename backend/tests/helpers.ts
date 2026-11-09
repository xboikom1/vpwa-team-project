import Channel from '#models/channel'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export async function truncateAll() {
  await db.rawQuery(
    'TRUNCATE users, auth_access_tokens, rate_limits, channels, channel_members, channel_invitations, messages RESTART IDENTITY CASCADE'
  )
}

export async function makeUser(nickName: string) {
  return User.create({
    firstName: 'Test',
    lastName: nickName,
    nickName,
    email: `${nickName}@example.com`,
    password: 'correct-horse',
  })
}

export async function makeChannel(
  admin: User,
  name: string,
  type: 'public' | 'private' = 'public',
  idleDays = 0
) {
  const channel = await Channel.create({
    name,
    type,
    adminId: admin.id,
    lastMessageAt: DateTime.now().minus({ days: idleDays }),
  })
  await channel.related('members').attach({ [admin.id]: { last_read_at: DateTime.now() } })
  return channel
}

export async function invite(channel: Channel, user: User, invitedBy: User) {
  await db.table('channel_invitations').insert({
    channel_id: channel.id,
    user_id: user.id,
    invited_by_id: invitedBy.id,
    created_at: new Date(),
  })
}

export async function addMember(channel: Channel, user: User) {
  await channel.related('members').attach({ [user.id]: { last_read_at: DateTime.now() } })
}

export function bodyOf(response: { body(): unknown }) {
  return response.body() as { data: any; errors: any; meta: any }
}
