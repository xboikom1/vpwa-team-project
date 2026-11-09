import User from '#models/user'
import limiter from '@adonisjs/limiter/services/main'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

const VALID = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  nickName: 'ada',
  email: 'ada@example.com',
  password: 'correct-horse',
}

test.group('auth', (group) => {
  group.each.setup(async () => {
    await db.rawQuery('TRUNCATE users, auth_access_tokens, rate_limits RESTART IDENTITY CASCADE')
    await limiter.clear()
  })

  test('registers a user and returns a token', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/register').json(VALID)

    response.assertStatus(201)
    const { user, token } = response.body().data
    assert.equal(user.nickName, 'ada')
    assert.notProperty(user, 'password')
    assert.isString(token)

    const stored = await User.findByOrFail('nickName', 'ada')
    assert.notEqual(stored.password, VALID.password)
  })

  test('normalises nickname and email casing on register', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({ ...VALID, nickName: 'ADA', email: 'Ada@Example.COM' })

    response.assertStatus(201)
    assert.equal(response.body().data.user.email, 'ada@example.com')
    assert.equal(response.body().data.user.nickName, 'ada')
  })

  test('rejects a duplicate nickname and email', async ({ client, assert }) => {
    await client.post('/api/v1/auth/register').json(VALID)

    const nick = await client
      .post('/api/v1/auth/register')
      .json({ ...VALID, email: 'other@example.com' })
    nick.assertStatus(422)
    assert.equal(nick.body().errors[0].field, 'nickName')

    const mail = await client
      .post('/api/v1/auth/register')
      .json({ ...VALID, nickName: 'other', email: 'ADA@example.com' })
    mail.assertStatus(422)
    assert.equal(mail.body().errors[0].field, 'email')
  })

  test('rejects invalid registration input', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({ ...VALID, nickName: 'bad nick!', password: 'short' })

    response.assertStatus(422)
    const fields = response.body().errors.map((error: { field: string }) => error.field)
    assert.includeMembers(fields, ['nickName', 'password'])
  })

  test('logs in with nickname, @nickname or email', async ({ client }) => {
    await client.post('/api/v1/auth/register').json(VALID)

    for (const identifier of ['ada', '@ada', 'ADA@example.com']) {
      const response = await client
        .post('/api/v1/auth/login')
        .json({ identifier, password: VALID.password })
      response.assertStatus(200)
    }
  })

  test('rejects wrong credentials without revealing which part failed', async ({
    client,
    assert,
  }) => {
    await client.post('/api/v1/auth/register').json(VALID)

    const wrongPassword = await client
      .post('/api/v1/auth/login')
      .json({ identifier: 'ada', password: 'nope-nope-nope' })
    const unknownUser = await client
      .post('/api/v1/auth/login')
      .json({ identifier: 'ghost', password: 'nope-nope-nope' })

    wrongPassword.assertStatus(400)
    unknownUser.assertStatus(400)
    assert.deepEqual(wrongPassword.body(), unknownUser.body())
  })

  test('returns the current user only with a valid token', async ({ client, assert }) => {
    const registered = await client.post('/api/v1/auth/register').json(VALID)
    const token = registered.body().data.token

    const anonymous = await client.get('/api/v1/auth/me')
    anonymous.assertStatus(401)

    const authed = await client.get('/api/v1/auth/me').bearerToken(token)
    authed.assertStatus(200)
    assert.equal(authed.body().data.email, 'ada@example.com')
  })

  test('logout revokes the token', async ({ client }) => {
    const registered = await client.post('/api/v1/auth/register').json(VALID)
    const token = registered.body().data.token

    const logout = await client.post('/api/v1/auth/logout').bearerToken(token)
    logout.assertStatus(200)

    const after = await client.get('/api/v1/auth/me').bearerToken(token)
    after.assertStatus(401)
  })
})
