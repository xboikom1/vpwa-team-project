import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    users: {
      columns: {
        status: { tsType: "'online' | 'dnd' | 'offline'" },
      },
    },
  },
} satisfies SchemaRules
