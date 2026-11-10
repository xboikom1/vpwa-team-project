import ChannelMemberService from '#services/channel_member_service'
import { nickNameValidator } from '#validators/channel'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChannelInvitationsController {
  /**
   * `/invite nickName`
   */
  @inject()
  async store({ auth, params, request, response }: HttpContext, members: ChannelMemberService) {
    const { nickName } = await request.validateUsing(nickNameValidator)
    const result = await members.invite(auth.getUserOrFail(), params.name, nickName)

    response.status(201)
    return { data: result }
  }
}
