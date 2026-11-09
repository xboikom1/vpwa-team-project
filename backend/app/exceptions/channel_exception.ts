import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChannelException extends Exception {
  field?: string

  static notMember(name: string) {
    return new ChannelException(`You are not a member of #${name}.`, { status: 404 })
  }

  static notAdmin(name: string) {
    return new ChannelException(`Only the admin can delete #${name}.`, { status: 403 })
  }

  static privateChannel(name: string) {
    return new ChannelException(`#${name} is private. Ask its admin for an invite.`, {
      status: 403,
    })
  }

  static invalidInvitation(name: string) {
    return new ChannelException(`The invitation to #${name} is no longer valid.`, { status: 404 })
  }

  static nameTaken() {
    const error = new ChannelException('That channel name is already taken. Pick another name.', {
      status: 422,
    })
    error.field = 'name'
    return error
  }

  async handle(error: this, { response }: HttpContext) {
    const item =
      error.field === undefined
        ? { message: error.message }
        : { field: error.field, message: error.message }

    response.status(error.status).send({ errors: [item] })
  }
}
