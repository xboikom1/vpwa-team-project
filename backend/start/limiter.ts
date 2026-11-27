import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', (ctx) => {
  const key = ctx.auth.user ? `user_${ctx.auth.user.id}` : ctx.request.ip()
  return limiter.allowRequests(120).every('1 minute').usingKey(`global_${key}`)
})

export const throttleLogin = limiter.define('login', (ctx) => {
  const identifier = String(ctx.request.input('identifier', '')).trim().toLowerCase()
  return limiter
    .allowRequests(5)
    .every('1 minute')
    .blockFor('2 mins')
    .usingKey(`login_${ctx.request.ip()}_${identifier}`)
})

export const throttleMessages = limiter.define('messages', (ctx) => {
  const key = ctx.auth.user?.id ?? ctx.request.ip()
  return limiter.allowRequests(30).every('10 seconds').usingKey(`messages_${key}`)
})

export const throttleRegister = limiter.define('register', (ctx) => {
  return limiter.allowRequests(10).every('1 hour').usingKey(`register_${ctx.request.ip()}`)
})

export const throttleTyping = limiter.define('typing', (ctx) => {
  const key = ctx.auth.user?.id ?? ctx.request.ip()
  return limiter.allowRequests(600).every('1 minute').usingKey(`typing_${key}`)
})
