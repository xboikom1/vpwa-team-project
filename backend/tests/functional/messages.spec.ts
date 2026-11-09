import Channel from '#models/channel'
import Message from '#models/message'
import type User from '#models/user'
import { addMember, bodyOf, makeChannel, makeUser, truncateAll } from '#tests/helpers'
import limiter from '@adonisjs/limiter/services/main'
import type { ApiClient } from '@japa/api-client'
import transmit from '@adonisjs/transmit/services/main'
import { test } from '@japa/runner'

interface MessageBody {
  id: number
  channelName: string
  author: string
  text: string
  createdAt: string
}

function texts(body: unknown): string[] {
  const { data } = body as { data: MessageBody[] }
  return data.map((message) => message.text)
}

async function unreadOf(client: ApiClient, user: User, name: string): Promise<number> {
  const response = await client.get('/api/v1/channels').loginAs(user)
  const channel = bodyOf(response).data.find((item: { name: string }) => item.name === name)
  return channel.unread
}

test.group('messages', (group) => {
  group.each.setup(async () => {
    await truncateAll()
    await limiter.clear()
  })

  test('a member sends a message and it is stored trimmed', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const room = await makeChannel(ada, 'room')

    const response = await client
      .post('/api/v1/channels/room/messages')
      .loginAs(ada)
      .json({ text: '  hello @bob  ' })

    response.assertStatus(201)
    const message = bodyOf(response).data as MessageBody
    assert.equal(message.text, 'hello @bob')
    assert.equal(message.author, 'ada')
    assert.equal(message.channelName, 'room')
    assert.isString(message.createdAt)

    const stored = await Message.findOrFail(message.id)
    assert.equal(stored.channelId, room.id)
    assert.equal(stored.userId, ada.id)
  })

  test('rejects empty and oversized messages', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    await makeChannel(ada, 'room')

    const empty = await client
      .post('/api/v1/channels/room/messages')
      .loginAs(ada)
      .json({ text: '   ' })
    empty.assertStatus(422)

    const long = await client
      .post('/api/v1/channels/room/messages')
      .loginAs(ada)
      .json({ text: 'x'.repeat(1001) })
    long.assertStatus(422)

    assert.lengthOf(await Message.all(), 0)
  })

  test('a non-member cannot send to or read a channel', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const eve = await makeUser('eve')
    await makeChannel(ada, 'vault', 'private')
    await makeChannel(ada, 'lobby', 'public')

    for (const name of ['vault', 'lobby']) {
      const send = await client
        .post(`/api/v1/channels/${name}/messages`)
        .loginAs(eve)
        .json({ text: 'let me in' })
      send.assertStatus(404)

      const read = await client.get(`/api/v1/channels/${name}/messages`).loginAs(eve)
      read.assertStatus(404)

      const markRead = await client.post(`/api/v1/channels/${name}/read`).loginAs(eve)
      markRead.assertStatus(404)
    }

    assert.lengthOf(await Message.all(), 0)
  })

  test('requires authentication', async ({ client }) => {
    const ada = await makeUser('ada')
    await makeChannel(ada, 'room')

    const send = await client.post('/api/v1/channels/room/messages').json({ text: 'hi' })
    send.assertStatus(401)
    const list = await client.get('/api/v1/channels/room/messages')
    list.assertStatus(401)
  })

  test('sending a message refreshes the channel activity', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    await makeChannel(ada, 'quiet', 'public', 29)

    await client.post('/api/v1/channels/quiet/messages').loginAs(ada).json({ text: 'still here' })

    const channel = await Channel.findByOrFail('name', 'quiet')
    assert.isBelow(Math.abs(channel.lastMessageAt.diffNow('minutes').minutes), 5)
  })

  test('purging an inactive channel removes its messages', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const stale = await makeChannel(ada, 'stale')
    await client.post('/api/v1/channels/stale/messages').loginAs(ada).json({ text: 'old' })
    await Channel.query()
      .where('id', stale.id)
      .update({ last_message_at: new Date(Date.now() - 31 * 24 * 3600 * 1000) })

    const response = await client.get('/api/v1/channels/stale/messages').loginAs(ada)
    response.assertStatus(404)
    assert.lengthOf(await Message.all(), 0)
  })

  test('lists the latest page oldest first and pages backwards', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const room = await makeChannel(ada, 'room')
    for (let index = 1; index <= 5; index += 1) {
      await Message.create({ channelId: room.id, userId: ada.id, content: `m${index}` })
    }

    const latest = await client.get('/api/v1/channels/room/messages?limit=2').loginAs(ada)
    latest.assertStatus(200)
    assert.deepEqual(texts(bodyOf(latest)), ['m4', 'm5'])
    assert.isTrue(bodyOf(latest).meta.hasMore)

    const firstId = bodyOf(latest).data[0].id
    const older = await client
      .get(`/api/v1/channels/room/messages?limit=2&before=${firstId}`)
      .loginAs(ada)
    assert.deepEqual(texts(bodyOf(older)), ['m2', 'm3'])
    assert.isTrue(bodyOf(older).meta.hasMore)

    const oldest = await client
      .get(`/api/v1/channels/room/messages?limit=2&before=${bodyOf(older).data[0].id}`)
      .loginAs(ada)
    assert.deepEqual(texts(bodyOf(oldest)), ['m1'])
    assert.isFalse(bodyOf(oldest).meta.hasMore)

    const invalid = await client.get('/api/v1/channels/room/messages?limit=1000').loginAs(ada)
    invalid.assertStatus(422)
  })

  test('counts unread messages from others until the channel is read', async ({
    client,
    assert,
  }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    const room = await makeChannel(ada, 'room')
    await addMember(room, bob)

    await client.post('/api/v1/channels/room/messages').loginAs(ada).json({ text: 'one' })
    await client.post('/api/v1/channels/room/messages').loginAs(ada).json({ text: 'two' })

    assert.equal(await unreadOf(client, bob, 'room'), 2)
    assert.equal(await unreadOf(client, ada, 'room'), 0)

    const read = await client.post('/api/v1/channels/room/read').loginAs(bob)
    read.assertStatus(204)
    assert.equal(await unreadOf(client, bob, 'room'), 0)

    await client.post('/api/v1/channels/room/messages').loginAs(ada).json({ text: 'three' })
    assert.equal(await unreadOf(client, bob, 'room'), 1)

    await client.post('/api/v1/channels/room/messages').loginAs(bob).json({ text: 'reply' })
    assert.equal(await unreadOf(client, bob, 'room'), 0)
    assert.equal(await unreadOf(client, ada, 'room'), 1)
  })

  test('broadcasts a new message to every member and nobody else', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    const eve = await makeUser('eve')
    const room = await makeChannel(ada, 'room')
    await addMember(room, bob)
    await makeChannel(eve, 'elsewhere')

    const events: { channel: string; payload: unknown }[] = []
    const off = transmit.on('broadcast', (event) => events.push(event))

    const response = await client
      .post('/api/v1/channels/room/messages')
      .loginAs(ada)
      .json({ text: 'hi all' })
    off()

    assert.sameMembers(
      events.map((event) => event.channel),
      ['users/ada', 'users/bob']
    )
    const payload = events[0].payload as { type: string; message: MessageBody }
    assert.equal(payload.type, 'message.created')
    assert.equal(payload.message.id, bodyOf(response).data.id)
    assert.equal(payload.message.text, 'hi all')
  })
})
