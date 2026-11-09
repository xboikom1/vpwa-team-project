import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    users: {
      columns: {
        status: { tsType: "'online' | 'dnd' | 'offline'" },
      },
    },
    channels: {
      columns: {
        type: { tsType: "'public' | 'private'" },
      },
    },
  },
} satisfies SchemaRules
