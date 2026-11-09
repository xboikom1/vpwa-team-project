import ChannelService from '#services/channel_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class InvitationsController {
  @inject()
  async index({ auth }: HttpContext, channels: ChannelService) {
    return { data: await channels.invitations(auth.getUserOrFail()) }
  }

  @inject()
  async accept({ auth, params, response }: HttpContext, channels: ChannelService) {
    await channels.acceptInvitation(auth.getUserOrFail(), params.name)

    return response.noContent()
  }

  @inject()
  async decline({ auth, params, response }: HttpContext, channels: ChannelService) {
    await channels.declineInvitation(auth.getUserOrFail(), params.name)

    return response.noContent()
  }
}
