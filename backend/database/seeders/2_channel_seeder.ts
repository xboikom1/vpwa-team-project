import Channel from '#models/channel'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

interface SeedChannel {
  name: string
  type: 'public' | 'private'
  admin: string
  members: readonly string[]
  idleDays: number
}

const EVERYONE = [
  'johndoe',
  'alex',
  'ed',
  'maya',
  'priya',
  'tomas',
  'lucia',
  'kai',
  'rosa',
  'john',
  'marek',
  'sara',
  'viktor',
  'jana',
]

const CHANNELS: readonly SeedChannel[] = [
  { name: 'general', type: 'public', admin: 'alex', members: EVERYONE, idleDays: 0 },
  {
    name: 'engineering',
    type: 'public',
    admin: 'johndoe',
    members: ['johndoe', 'ed', 'marek', 'priya', 'tomas', 'kai'],
    idleDays: 0,
  },
  {
    name: 'design',
    type: 'public',
    admin: 'maya',
    members: ['maya', 'lucia', 'rosa', 'kai', 'johndoe'],
    idleDays: 2,
  },
  {
    name: 'random',
    type: 'public',
    admin: 'john',
    members: ['kai', 'ed', 'lucia', 'rosa', 'johndoe', 'john'],
    idleDays: 1,
  },
  {
    name: 'support',
    type: 'public',
    admin: 'priya',
    members: ['priya', 'rosa', 'jana'],
    idleDays: 5,
  },
  {
    name: 'admins',
    type: 'private',
    admin: 'alex',
    members: ['alex', 'maya', 'sara', 'johndoe', 'john'],
    idleDays: 1,
  },
  {
    name: 'sec-review',
    type: 'private',
    admin: 'johndoe',
    members: ['johndoe', 'viktor', 'sara'],
    idleDays: 3,
  },
  { name: 'q3-planning', type: 'private', admin: 'maya', members: ['maya', 'alex'], idleDays: 0 },
]

const INVITATIONS: readonly { channel: string; user: string; invitedBy: string }[] = [
  { channel: 'q3-planning', user: 'johndoe', invitedBy: 'maya' },
  { channel: 'sec-review', user: 'john', invitedBy: 'johndoe' },
]

export default class extends BaseSeeder {
  async run() {
    const users = await User.all()
    const idOf = (nickName: string) => {
      const user = users.find((item) => item.nickName === nickName)
      if (!user) throw new Error(`Seed user @${nickName} is missing. Run the user seeder first.`)
      return user.id
    }

    const now = DateTime.now()

    for (const seed of CHANNELS) {
      const channel = await Channel.firstOrCreate(
        { name: seed.name },
        {
          name: seed.name,
          type: seed.type,
          adminId: idOf(seed.admin),
          lastMessageAt: now.minus({ days: seed.idleDays }),
        }
      )

      await channel
        .related('members')
        .sync(
          Object.fromEntries(seed.members.map((nick) => [idOf(nick), { last_read_at: now }])),
          false
        )
    }

    for (const invitation of INVITATIONS) {
      const channel = await Channel.findByOrFail('name', invitation.channel)
      const alreadyMember = await channel
        .related('members')
        .query()
        .where('users.id', idOf(invitation.user))
        .first()
      if (alreadyMember) continue

      await this.client
        .table('channel_invitations')
        .insert({
          channel_id: channel.id,
          user_id: idOf(invitation.user),
          invited_by_id: idOf(invitation.invitedBy),
          created_at: now.minus({ minutes: 5 }).toJSDate(),
        })
        .onConflict(['channel_id', 'user_id'])
        .ignore()
    }
  }
}
