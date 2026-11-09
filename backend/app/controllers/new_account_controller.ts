import User from '#models/user'
import { registerValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const user = await User.create(payload)
    const token = await User.accessTokens.create(user)

    response.status(201)
    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
