/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    register: typeof routes['auth.register']
    login: typeof routes['auth.login']
    me: typeof routes['auth.me']
    logout: typeof routes['auth.logout']
  }
  channels: {
    index: typeof routes['channels.index']
    store: typeof routes['channels.store']
    join: typeof routes['channels.join']
    destroy: typeof routes['channels.destroy']
    leave: typeof routes['channels.leave']
    messages: {
      index: typeof routes['channels.messages.index']
      store: typeof routes['channels.messages.store']
    }
    read: typeof routes['channels.read']
  }
  invitations: {
    index: typeof routes['invitations.index']
    accept: typeof routes['invitations.accept']
    decline: typeof routes['invitations.decline']
  }
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
}
