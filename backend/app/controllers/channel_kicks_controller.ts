import ChannelMemberService from '#services/channel_member_service'
import { nickNameValidator } from '#validators/channel'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChannelKicksController {
  /**
   * `/kick nickName`
   */
  @inject()
  async store({ auth, params, request }: HttpContext, members: ChannelMemberService) {
    const { nickName } = await request.validateUsing(nickNameValidator)

    return { data: await members.kick(auth.getUserOrFail(), params.name, nickName) }
  }
}
