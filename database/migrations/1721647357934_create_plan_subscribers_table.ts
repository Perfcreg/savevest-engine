import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plan_subscribers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('plan_id').unsigned().references('id').inTable('plans')
      table.float('current_amount', 10, 2).notNullable().defaultTo(0);
      table.boolean('locked').nullable().defaultTo(false)
      table.string('status').nullable().checkBetween(['Active', 'Completed', 'Cancelled']).defaultTo('Active')
      table.timestamp('start_date').notNullable()
      table.timestamp('end_date').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}