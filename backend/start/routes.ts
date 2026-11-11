import { middleware } from '#start/kernel'
import { throttle, throttleLogin, throttleMessages, throttleRegister } from '#start/limiter'
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
            router.get(':name/messages', [controllers.Messages, 'index']).as('messages.index')
            router
              .post(':name/messages', [controllers.Messages, 'store'])
              .use(throttleMessages)
              .as('messages.store')
            router.post(':name/read', [controllers.ChannelReads, 'store']).as('read')
            router.get(':name/members', [controllers.ChannelMembers, 'index']).as('members.index')
            router
              .delete(':name/members/:nickName', [controllers.ChannelMembers, 'destroy'])
              .as('members.destroy')
            router
              .post(':name/invitations', [controllers.ChannelInvitations, 'store'])
              .as('invitations.store')
            router.post(':name/kicks', [controllers.ChannelKicks, 'store']).as('kicks.store')
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
