import MessageService from '#services/message_service'
import { listMessagesValidator, sendMessageValidator } from '#validators/message'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class MessagesController {
  @inject()
  async index({ auth, params, request }: HttpContext, messages: MessageService) {
    const options = await request.validateUsing(listMessagesValidator)
    const { messages: page, hasMore } = await messages.list(
      auth.getUserOrFail(),
      params.name,
      options
    )

    return { data: page, meta: { hasMore } }
  }

  @inject()
  async store({ auth, params, request, response }: HttpContext, messages: MessageService) {
    const { text } = await request.validateUsing(sendMessageValidator)
    const message = await messages.create(auth.getUserOrFail(), params.name, text)

    response.status(201)
    return { data: message }
  }
}
