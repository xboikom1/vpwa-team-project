import { apiClient } from '@japa/api-client'
import { assert } from '@japa/assert'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import type { Config, SetupHookHandler, TeardownHookHandler } from '@japa/runner/types'
import app from '@adonisjs/core/services/app'

export const plugins: Config['plugins'] = [assert(), apiClient(), pluginAdonisJS(app)]

export const runnerHooks: {
  setup: SetupHookHandler[]
  teardown: TeardownHookHandler[]
} = {
  setup: [],
  teardown: [],
}
