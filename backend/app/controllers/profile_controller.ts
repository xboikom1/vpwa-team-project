import UserTransformer from '#transformers/user_transformer'
import { updatePreferencesValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }

  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { notifyMentionsOnly } = await request.validateUsing(updatePreferencesValidator)

    user.notifyMentionsOnly = notifyMentionsOnly
    await user.save()

    return serialize(UserTransformer.transform(user))
  }
}
