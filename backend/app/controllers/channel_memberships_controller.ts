import ChannelService from '#services/channel_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChannelMembershipsController {
  @inject()
  async destroy({ auth, params, response }: HttpContext, channels: ChannelService) {
    await channels.leave(auth.getUserOrFail(), params.name)

    return response.noContent()
  }
}
