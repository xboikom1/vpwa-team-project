import User from '#models/user'
import { addMember, makeChannel, makeUser, truncateAll } from '#tests/helpers'
import env from '#start/env'
import limiter from '@adonisjs/limiter/services/main'
import { test } from '@japa/runner'

const BASE_URL = `http://${env.get('HOST')}:${env.get('PORT')}`

async function openStream(uid: string, signal: AbortSignal) {
  const response = await fetch(`${BASE_URL}/__transmit/events?uid=${uid}`, { signal })
  return response.body!.getReader()
}

async function subscribe(uid: string, channel: string, user?: User) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (user) {
    const token = await User.accessTokens.create(user)
    headers.authorization = `Bearer ${token.value!.release()}`
  }

  return fetch(`${BASE_URL}/__transmit/subscribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uid, channel }),
  })
}

async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  needle: string,
  timeoutMs = 3000
) {
  const decoder = new TextDecoder()
  const deadline = Date.now() + timeoutMs
  let received = ''

  while (Date.now() < deadline && !received.includes(needle)) {
    const result = await Promise.race([
      reader.read(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
    ])
    if (result && !result.done) received += decoder.decode(result.value)
  }

  return received
}

test.group('realtime', (group) => {
  group.each.setup(async () => {
    await truncateAll()
    await limiter.clear()
  })

  test('only the owner can subscribe to their user channel', async ({ assert }) => {
    const ada = await makeUser('ada')
    await makeUser('bob')
    const controller = new AbortController()
    await openStream('uid-auth', controller.signal)

    const own = await subscribe('uid-auth', 'users/ada', ada)
    const other = await subscribe('uid-auth', 'users/bob', ada)
    const anonymous = await subscribe('uid-auth', 'users/ada')
    controller.abort()

    assert.equal(own.status, 204)
    assert.equal(other.status, 400)
    assert.equal(anonymous.status, 400)
  })

  test('a posted message reaches the subscribed member over the stream', async ({
    client,
    assert,
  }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    const room = await makeChannel(ada, 'room')
    await addMember(room, bob)

    const controller = new AbortController()
    const reader = await openStream('uid-delivery', controller.signal)
    const subscribed = await subscribe('uid-delivery', 'users/bob', bob)
    assert.equal(subscribed.status, 204)

    await client.post('/api/v1/channels/room/messages').loginAs(ada).json({ text: 'ping bob' })

    const received = await readUntil(reader, 'ping bob')
    controller.abort()

    assert.include(received, 'message.created')
    assert.include(received, 'ping bob')
  })
})
