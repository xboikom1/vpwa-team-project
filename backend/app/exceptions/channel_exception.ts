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

  static banned(name: string) {
    return new ChannelException(`You are banned from #${name}.`, { status: 403 })
  }

  static userNotFound(nickName: string) {
    return new ChannelException(`There is no user @${nickName}.`, { status: 404 })
  }

  static notInChannel(nickName: string, name: string) {
    return new ChannelException(`@${nickName} is not in #${name}.`, { status: 404 })
  }

  static alreadyMember(nickName: string, name: string) {
    return new ChannelException(`@${nickName} is already in #${name}.`, { status: 409 })
  }

  static alreadyInvited(nickName: string, name: string) {
    return new ChannelException(`@${nickName} is already invited to #${name}.`, { status: 409 })
  }

  static adminOnlyInvite(name: string) {
    return new ChannelException(`#${name} is private. Only its admin can invite people.`, {
      status: 403,
    })
  }

  static adminOnlyRemove(name: string) {
    return new ChannelException(`Only the admin can remove people from #${name}.`, {
      status: 403,
    })
  }

  static targetBanned(nickName: string, name: string) {
    return new ChannelException(
      `@${nickName} is banned from #${name}. Only the admin can let them back in.`,
      { status: 403 }
    )
  }

  static revokePublic(name: string) {
    return new ChannelException(`/revoke only works in private channels. Use /kick in #${name}.`, {
      status: 422,
    })
  }

  static revokeSelf(name: string) {
    return new ChannelException(`You are the admin. Use /quit to close #${name}.`, {
      status: 422,
    })
  }

  static kickSelf() {
    return new ChannelException('You cannot kick yourself. Use /cancel to leave.', {
      status: 422,
    })
  }

  static kickAdmin(nickName: string, name: string) {
    return new ChannelException(`@${nickName} is the admin of #${name} and cannot be kicked.`, {
      status: 403,
    })
  }

  static alreadyVoted(nickName: string, votes: number, required: number) {
    return new ChannelException(`You already voted to kick @${nickName} (${votes}/${required}).`, {
      status: 409,
    })
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
