import type Channel from '#models/channel'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ChannelTransformer extends BaseTransformer<Channel> {
  toObject() {
    return {
      ...this.pick(this.resource, ['name', 'type', 'createdAt', 'lastMessageAt']),
      role: this.resource.$extras.role as 'admin' | 'member',
    }
  }
}
