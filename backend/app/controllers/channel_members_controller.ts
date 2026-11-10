import ChannelMemberService from '#services/channel_member_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChannelMembersController {
  /**
   * `/list`
   */
  @inject()
  async index({ auth, params }: HttpContext, members: ChannelMemberService) {
    return { data: await members.list(auth.getUserOrFail(), params.name) }
  }

  /**
   * `/revoke nickName`
   */
  @inject()
  async destroy({ auth, params, response }: HttpContext, members: ChannelMemberService) {
    await members.revoke(auth.getUserOrFail(), params.name, String(params.nickName))

    return response.noContent()
  }
}
