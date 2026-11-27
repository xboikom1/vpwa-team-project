import ChannelService from '#services/channel_service'
import RealtimeService from '#services/realtime_service'
import { typingValidator } from '#validators/message'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChannelTypingController {
  @inject()
  async store(
    { auth, params, request, response }: HttpContext,
    channels: ChannelService,
    realtime: RealtimeService
  ) {
    const user = auth.getUserOrFail()
    const { text } = await request.validateUsing(typingValidator)
    const channel = await channels.findForMember(user, params.name)

    await realtime.publishTyping(channel.id, {
      channelName: channel.name,
      nickName: user.nickName,
      text: text ?? '',
    })

    return response.noContent()
  }
}
