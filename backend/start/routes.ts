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
  })
  .prefix('/api/v1')
  .use(throttle)
