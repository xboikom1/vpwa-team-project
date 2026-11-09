import MessageService from '#services/message_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChannelReadsController {
  @inject()
  async store({ auth, params, response }: HttpContext, messages: MessageService) {
    await messages.markRead(auth.getUserOrFail(), params.name)

    return response.noContent()
  }
}
