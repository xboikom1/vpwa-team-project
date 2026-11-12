import Channel from '#models/channel'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

const CHANNEL_NAME = 'general'
const MESSAGE_COUNT = 200
const MINUTES_BETWEEN_MESSAGES = 17
const MENTION_EVERY = 15
const MENTIONED_USER = 'johndoe'

const AUTHORS = [
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
  'johndoe',
]

const TOPICS = [
  'the release notes',
  'the login page',
  'the sprint board',
  'the database backup',
  'the new onboarding flow',
  'the API docs',
  'the staging server',
  'the design review',
  'the customer feedback',
  'the test coverage report',
  'the team offsite',
  'the mobile layout',
]

const TEMPLATES = [
  'Has anyone looked at {topic} yet?',
  'I just pushed an update to {topic}.',
  'Quick reminder: {topic} is due on Friday.',
  'Can someone help me with {topic}?',
  'Nice work on {topic}, it looks great.',
  'I left a few comments on {topic}.',
  'Are we still meeting about {topic} today?',
  'I think {topic} needs one more pass.',
  'Good morning everyone!',
  'Coffee break, back in 10 minutes.',
  'Who is taking {topic} this week?',
  'Moving {topic} to the next sprint.',
  'Thanks, that fixed it.',
  'Does {topic} block anything else?',
  'I will have {topic} ready after lunch.',
  'Heads up: {topic} changed slightly.',
  'Let us discuss {topic} in the standup.',
  'Lunch anyone?',
  'Found a small bug in {topic}.',
  'All green on {topic} now.',
  'Can we pair on {topic} tomorrow?',
  'Updated the ticket for {topic}.',
  'See you all tomorrow.',
  'Is {topic} documented somewhere?',
]

function pick<T>(items: readonly T[], index: number, stride: number): T {
  return items[(index * stride) % items.length]!
}

function messageText(index: number, author: string): string {
  const text = pick(TEMPLATES, index, 7).replace('{topic}', pick(TOPICS, index, 5))
  const mentions = index % MENTION_EVERY === 0 && author !== MENTIONED_USER
  return mentions ? `@${MENTIONED_USER} ${text}` : text
}

export default class extends BaseSeeder {
  async run() {
    const channel = await Channel.findByOrFail('name', CHANNEL_NAME)

    const existing = await this.client
      .from('messages')
      .where('channel_id', channel.id)
      .count('* as total')
      .first()
    if (Number(existing.total) > 0) return

    const users = await User.query().whereIn('nickName', AUTHORS)
    const idOf = (nickName: string) => {
      const user = users.find((item) => item.nickName === nickName)
      if (!user) throw new Error(`Seed user @${nickName} is missing. Run the user seeder first.`)
      return user.id
    }

    const newest = DateTime.now().minus({ minutes: 5 })

    const rows = Array.from({ length: MESSAGE_COUNT }, (_, index) => {
      const author = pick(AUTHORS, index, 5)
      const minutesAgo = (MESSAGE_COUNT - 1 - index) * MINUTES_BETWEEN_MESSAGES

      return {
        channel_id: channel.id,
        user_id: idOf(author),
        content: messageText(index, author),
        created_at: newest.minus({ minutes: minutesAgo }).toJSDate(),
      }
    })

    await this.client.table('messages').multiInsert(rows)

    channel.lastMessageAt = newest
    await channel.save()
  }
}
