import Channel from '#models/channel'
import { bodyOf, invite, makeChannel, makeUser, truncateAll } from '#tests/helpers'
import limiter from '@adonisjs/limiter/services/main'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

function names(body: unknown): string[] {
  const { data } = body as { data: { name: string }[] }
  return data.map((channel) => channel.name)
}

test.group('channels', (group) => {
  group.each.setup(async () => {
    await truncateAll()
    await limiter.clear()
  })

  test('creates a channel and lists it with the admin role', async ({ client, assert }) => {
    const ada = await makeUser('ada')

    const created = await client
      .post('/api/v1/channels')
      .loginAs(ada)
      .json({ name: 'General', type: 'private' })
    created.assertStatus(201)
    assert.equal(bodyOf(created).data.name, 'general')
    assert.equal(bodyOf(created).data.role, 'admin')

    const list = await client.get('/api/v1/channels').loginAs(ada)
    list.assertStatus(200)
    assert.deepEqual(names(bodyOf(list)), ['general'])
    assert.equal(bodyOf(list).data[0].type, 'private')
    assert.equal(bodyOf(list).data[0].role, 'admin')
  })

  test('rejects duplicate and invalid channel names', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    await makeChannel(ada, 'general')

    const duplicate = await client
      .post('/api/v1/channels')
      .loginAs(ada)
      .json({ name: 'general', type: 'public' })
    duplicate.assertStatus(422)
    assert.equal(bodyOf(duplicate).errors[0].field, 'name')

    const invalid = await client
      .post('/api/v1/channels')
      .loginAs(ada)
      .json({ name: 'bad name!', type: 'public' })
    invalid.assertStatus(422)

    const badType = await client
      .post('/api/v1/channels')
      .loginAs(ada)
      .json({ name: 'ok', type: 'secret' })
    badType.assertStatus(422)
  })

  test('requires authentication', async ({ client }) => {
    const response = await client.get('/api/v1/channels')
    response.assertStatus(401)
  })

  test('lists only channels the user belongs to', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    await makeChannel(ada, 'alpha')
    await makeChannel(bob, 'beta')
    await makeChannel(bob, 'secret', 'private')

    const list = await client.get('/api/v1/channels').loginAs(ada)
    assert.deepEqual(names(bodyOf(list)), ['alpha'])
  })

  test('join creates a missing channel and joins a public one', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')

    const created = await client
      .post('/api/v1/channels/join')
      .loginAs(ada)
      .json({ name: 'lobby', type: 'public' })
    created.assertStatus(201)
    assert.equal(bodyOf(created).data.role, 'admin')

    const joined = await client
      .post('/api/v1/channels/join')
      .loginAs(bob)
      .json({ name: 'lobby', type: 'public' })
    joined.assertStatus(200)
    assert.equal(bodyOf(joined).data.role, 'member')

    const again = await client
      .post('/api/v1/channels/join')
      .loginAs(bob)
      .json({ name: 'lobby', type: 'public' })
    again.assertStatus(200)

    const list = await client.get('/api/v1/channels').loginAs(bob)
    assert.deepEqual(names(bodyOf(list)), ['lobby'])
  })

  test('join refuses a private channel without an invitation', async ({ client }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    await makeChannel(ada, 'vault', 'private')

    const response = await client
      .post('/api/v1/channels/join')
      .loginAs(bob)
      .json({ name: 'vault', type: 'public' })
    response.assertStatus(403)
  })

  test('join consumes an invitation to a private channel', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    const vault = await makeChannel(ada, 'vault', 'private')
    await invite(vault, bob, ada)

    const response = await client
      .post('/api/v1/channels/join')
      .loginAs(bob)
      .json({ name: 'vault', type: 'public' })
    response.assertStatus(200)

    const invitations = await client.get('/api/v1/invitations').loginAs(bob)
    assert.lengthOf(bodyOf(invitations).data, 0)
  })

  test('a member can leave and the channel leaves their list', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    const room = await makeChannel(ada, 'room')
    await room.related('members').attach({ [bob.id]: { last_read_at: DateTime.now() } })

    const leave = await client.delete('/api/v1/channels/room/membership').loginAs(bob)
    leave.assertStatus(204)

    const bobList = await client.get('/api/v1/channels').loginAs(bob)
    assert.lengthOf(bodyOf(bobList).data, 0)
    const adaList = await client.get('/api/v1/channels').loginAs(ada)
    assert.deepEqual(names(bodyOf(adaList)), ['room'])
  })

  test('the admin leaving deletes the channel for everyone', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    const room = await makeChannel(ada, 'room')
    await room.related('members').attach({ [bob.id]: { last_read_at: DateTime.now() } })

    const leave = await client.delete('/api/v1/channels/room/membership').loginAs(ada)
    leave.assertStatus(204)

    const bobList = await client.get('/api/v1/channels').loginAs(bob)
    assert.lengthOf(bodyOf(bobList).data, 0)
  })

  test('leaving a channel you are not in is a 404', async ({ client }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    await makeChannel(ada, 'room')

    const response = await client.delete('/api/v1/channels/room/membership').loginAs(bob)
    response.assertStatus(404)
  })

  test('only the admin can delete a channel', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    const eve = await makeUser('eve')
    const room = await makeChannel(ada, 'room')
    await room.related('members').attach({ [bob.id]: { last_read_at: DateTime.now() } })

    const asMember = await client.delete('/api/v1/channels/room').loginAs(bob)
    asMember.assertStatus(403)

    const asOutsider = await client.delete('/api/v1/channels/room').loginAs(eve)
    asOutsider.assertStatus(404)

    const asAdmin = await client.delete('/api/v1/channels/room').loginAs(ada)
    asAdmin.assertStatus(204)
    assert.isNull(await Channel.findBy('name', 'room'))
  })

  test('lists, accepts and declines invitations', async ({ client, assert }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    const vault = await makeChannel(ada, 'vault', 'private')
    const lobby = await makeChannel(ada, 'lobby')
    await invite(vault, bob, ada)
    await invite(lobby, bob, ada)

    const pending = await client.get('/api/v1/invitations').loginAs(bob)
    pending.assertStatus(200)
    assert.lengthOf(bodyOf(pending).data, 2)
    assert.equal(bodyOf(pending).data[0].invitedBy, 'ada')

    const accept = await client.post('/api/v1/invitations/vault/accept').loginAs(bob)
    accept.assertStatus(204)
    const decline = await client.delete('/api/v1/invitations/lobby').loginAs(bob)
    decline.assertStatus(204)

    const list = await client.get('/api/v1/channels').loginAs(bob)
    assert.deepEqual(names(bodyOf(list)), ['vault'])
    const after = await client.get('/api/v1/invitations').loginAs(bob)
    assert.lengthOf(bodyOf(after).data, 0)

    const stale = await client.post('/api/v1/invitations/vault/accept').loginAs(bob)
    stale.assertStatus(404)
  })

  test('removes channels idle for more than 30 days and frees the name', async ({
    client,
    assert,
  }) => {
    const ada = await makeUser('ada')
    const bob = await makeUser('bob')
    await makeChannel(ada, 'stale', 'public', 31)
    await makeChannel(ada, 'fresh', 'public', 29)

    const list = await client.get('/api/v1/channels').loginAs(ada)
    assert.deepEqual(names(bodyOf(list)), ['fresh'])

    const reused = await client
      .post('/api/v1/channels')
      .loginAs(bob)
      .json({ name: 'stale', type: 'private' })
    reused.assertStatus(201)
    assert.equal(bodyOf(reused).data.type, 'private')
  })
})
