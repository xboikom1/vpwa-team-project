/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'auth.register': {
    methods: ["POST"],
    pattern: '/api/v1/auth/register',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"register"]],
    types: placeholder as Registry['auth.register']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/auth/me',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"me"]],
    types: placeholder as Registry['auth.me']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/api/v1/auth/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"logout"]],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'channels.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"]],
    types: placeholder as Registry['channels.index']['types'],
  },
  'channels.store': {
    methods: ["POST"],
    pattern: '/api/v1/channels',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"]],
    types: placeholder as Registry['channels.store']['types'],
  },
  'channels.join': {
    methods: ["POST"],
    pattern: '/api/v1/channels/join',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[0,"join"]],
    types: placeholder as Registry['channels.join']['types'],
  },
  'channels.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/channels/:name',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"name"]],
    types: placeholder as Registry['channels.destroy']['types'],
  },
  'channels.leave': {
    methods: ["DELETE"],
    pattern: '/api/v1/channels/:name/membership',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"name"],[0,"membership"]],
    types: placeholder as Registry['channels.leave']['types'],
  },
  'channels.messages.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels/:name/messages',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"name"],[0,"messages"]],
    types: placeholder as Registry['channels.messages.index']['types'],
  },
  'channels.messages.store': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:name/messages',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"name"],[0,"messages"]],
    types: placeholder as Registry['channels.messages.store']['types'],
  },
  'channels.read': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:name/read',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"name"],[0,"read"]],
    types: placeholder as Registry['channels.read']['types'],
  },
  'invitations.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/invitations',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"]],
    types: placeholder as Registry['invitations.index']['types'],
  },
  'invitations.accept': {
    methods: ["POST"],
    pattern: '/api/v1/invitations/:name/accept',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"],[1,"name"],[0,"accept"]],
    types: placeholder as Registry['invitations.accept']['types'],
  },
  'invitations.decline': {
    methods: ["DELETE"],
    pattern: '/api/v1/invitations/:name',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"],[1,"name"]],
    types: placeholder as Registry['invitations.decline']['types'],
  },
  'event_stream': {
    methods: ["GET","HEAD"],
    pattern: '/__transmit/events',
    tokens: [[0,"__transmit"],[0,"events"]],
    types: placeholder as Registry['event_stream']['types'],
  },
  'subscribe': {
    methods: ["POST"],
    pattern: '/__transmit/subscribe',
    tokens: [[0,"__transmit"],[0,"subscribe"]],
    types: placeholder as Registry['subscribe']['types'],
  },
  'unsubscribe': {
    methods: ["POST"],
    pattern: '/__transmit/unsubscribe',
    tokens: [[0,"__transmit"],[0,"unsubscribe"]],
    types: placeholder as Registry['unsubscribe']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
