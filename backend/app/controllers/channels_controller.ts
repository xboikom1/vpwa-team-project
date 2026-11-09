import ChannelTransformer from '#transformers/channel_transformer'
import ChannelService from '#services/channel_service'
import { channelValidator } from '#validators/channel'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChannelsController {
  @inject()
  async index({ auth, serialize }: HttpContext, channels: ChannelService) {
    return serialize(ChannelTransformer.transform(await channels.list(auth.getUserOrFail())))
  }

  @inject()
  async store({ auth, request, response, serialize }: HttpContext, channels: ChannelService) {
    const { name, type } = await request.validateUsing(channelValidator)
    const channel = await channels.create(auth.getUserOrFail(), name, type)

    response.status(201)
    return serialize(ChannelTransformer.transform(channel))
  }

  @inject()
  async join({ auth, request, response, serialize }: HttpContext, channels: ChannelService) {
    const { name, type } = await request.validateUsing(channelValidator)
    const { channel, created } = await channels.join(auth.getUserOrFail(), name, type)

    response.status(created ? 201 : 200)
    return serialize(ChannelTransformer.transform(channel))
  }

  @inject()
  async destroy({ auth, params, response }: HttpContext, channels: ChannelService) {
    await channels.destroy(auth.getUserOrFail(), params.name)

    return response.noContent()
  }
}
