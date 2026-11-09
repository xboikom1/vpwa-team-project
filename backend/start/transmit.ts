import { userChannel } from '#services/realtime_service'
import transmit from '@adonisjs/transmit/services/main'

transmit.authorize<{ nickName: string }>('users/:nickName', (ctx, { nickName }) => {
  const user = ctx.auth.user
  return user !== undefined && userChannel(user.nickName) === userChannel(nickName)
})

transmit.registerRoutes()
