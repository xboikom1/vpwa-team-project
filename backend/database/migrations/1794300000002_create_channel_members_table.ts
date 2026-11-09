import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('channel_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.timestamp('joined_at').notNullable()
      table.timestamp('last_read_at').notNullable()

      table.primary(['channel_id', 'user_id'])
      table.index('user_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
