import { middleware } from '#start/kernel'
import { throttle, throttleLogin, throttleRegister } from '#start/limiter'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { name: 'Chatflow API' }
})

router
  .group(() => {
    router
      .group(() => {
        router
          .post('register', [controllers.NewAccount, 'store'])
          .use(throttleRegister)
          .as('register')
        router.post('login', [controllers.AccessTokens, 'store']).use(throttleLogin).as('login')

        router
          .group(() => {
            router.get('me', [controllers.Profile, 'show']).as('me')
            router.post('logout', [controllers.AccessTokens, 'destroy']).as('logout')
          })
          .use(middleware.auth())
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [controllers.Channels, 'index']).as('index')
            router.post('/', [controllers.Channels, 'store']).as('store')
            router.post('join', [controllers.Channels, 'join']).as('join')
            router.delete(':name', [controllers.Channels, 'destroy']).as('destroy')
            router
              .delete(':name/membership', [controllers.ChannelMemberships, 'destroy'])
              .as('leave')
          })
          .prefix('channels')
          .as('channels')

        router
          .group(() => {
            router.get('/', [controllers.Invitations, 'index']).as('index')
            router.post(':name/accept', [controllers.Invitations, 'accept']).as('accept')
            router.delete(':name', [controllers.Invitations, 'decline']).as('decline')
          })
          .prefix('invitations')
          .as('invitations')
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
  .use(throttle)
