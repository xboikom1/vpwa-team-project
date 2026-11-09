import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'channels.store': { paramsTuple?: []; params?: {} }
    'channels.join': { paramsTuple?: []; params?: {} }
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.leave': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.messages.index': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.messages.store': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.read': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'invitations.index': { paramsTuple?: []; params?: {} }
    'invitations.accept': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'invitations.decline': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'channels.messages.index': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'invitations.index': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'channels.index': { paramsTuple?: []; params?: {} }
    'channels.messages.index': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'invitations.index': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'channels.store': { paramsTuple?: []; params?: {} }
    'channels.join': { paramsTuple?: []; params?: {} }
    'channels.messages.store': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.read': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'invitations.accept': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'channels.leave': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'invitations.decline': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}