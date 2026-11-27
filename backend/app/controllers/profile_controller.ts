import RealtimeService from '#services/realtime_service'
import UserTransformer from '#transformers/user_transformer'
import { updatePreferencesValidator } from '#validators/auth'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }
  @inject()
  async update({ auth, request, serialize }: HttpContext, realtime: RealtimeService) {
    const user = auth.getUserOrFail()
    const { notifyMentionsOnly, status } = await request.validateUsing(updatePreferencesValidator)

    if (notifyMentionsOnly !== undefined) user.notifyMentionsOnly = notifyMentionsOnly
    const statusChanged = status !== undefined && status !== user.status
    if (status !== undefined) user.status = status
    await user.save()

    if (statusChanged) await realtime.publishStatus(user)

    return serialize(UserTransformer.transform(user))
  }
}
