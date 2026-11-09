/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse, Method, PathWithRegistry, PatternsByMethod, RouteWithRegistry } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'
import type { routes } from './index.ts'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.register': {
    methods: ["POST"]
    pattern: '/api/v1/auth/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').registerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').registerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/api/v1/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'channels.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/channels'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['index']>>>
    }
  }
  'channels.store': {
    methods: ["POST"]
    pattern: '/api/v1/channels'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').channelValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').channelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'channels.join': {
    methods: ["POST"]
    pattern: '/api/v1/channels/join'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').channelValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').channelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['join']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['join']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['join']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'channels.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/channels/:name'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/channels_controller').default['destroy']>>>
    }
  }
  'channels.leave': {
    methods: ["DELETE"]
    pattern: '/api/v1/channels/:name/membership'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channel_memberships_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channel_memberships_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/channel_memberships_controller').default['destroy']>>>
    }
  }
  'channels.messages.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/channels/:name/messages'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/message').listMessagesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'channels.messages.store': {
    methods: ["POST"]
    pattern: '/api/v1/channels/:name/messages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/message').sendMessageValidator)>>
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/message').sendMessageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/messages_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'channels.read': {
    methods: ["POST"]
    pattern: '/api/v1/channels/:name/read'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/channel_reads_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/channel_reads_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/channel_reads_controller').default['store']>>>
    }
  }
  'invitations.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/invitations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['index']>>>
    }
  }
  'invitations.accept': {
    methods: ["POST"]
    pattern: '/api/v1/invitations/:name/accept'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['accept']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['accept']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['accept']>>>
    }
  }
  'invitations.decline': {
    methods: ["DELETE"]
    pattern: '/api/v1/invitations/:name'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['decline']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['decline']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['decline']>>>
    }
  }
  'event_stream': {
    methods: ["GET","HEAD"]
    pattern: '/__transmit/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'subscribe': {
    methods: ["POST"]
    pattern: '/__transmit/subscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'unsubscribe': {
    methods: ["POST"]
    pattern: '/__transmit/unsubscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
}

export namespace Route {
  export type Request<Name extends keyof typeof routes> = RouteWithRegistry.Request<typeof routes, Name>
  export type Response<Name extends keyof typeof routes> = RouteWithRegistry.Response<typeof routes, Name>
  export type Params<Name extends keyof typeof routes> = RouteWithRegistry.Params<typeof routes, Name>
  export type Body<Name extends keyof typeof routes> = RouteWithRegistry.Body<typeof routes, Name>
  export type Query<Name extends keyof typeof routes> = RouteWithRegistry.Query<typeof routes, Name>
  export type Error<Name extends keyof typeof routes> = RouteWithRegistry.Error<typeof routes, Name>
}

export namespace Path {
  export type Request<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Request<typeof routes, M, P>
  export type Response<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Response<typeof routes, M, P>
  export type Params<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Params<typeof routes, M, P>
  export type Body<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Body<typeof routes, M, P>
  export type Query<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Query<typeof routes, M, P>
  export type Error<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Error<typeof routes, M, P>
}
