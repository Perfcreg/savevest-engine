import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'savings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE').notNullable();
      table.integer('plan_id').unsigned().references('plans.id').onDelete('CASCADE').notNullable();
      table.decimal('current_amount', 10, 2).defaultTo(0).notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.enu('status', ['Active', 'Completed', 'Cancelled'], {
        useNative: true,
        enumName: 'savings_status',
        existingType: false,
      }).defaultTo('Active').notNullable();
      table.date('withdraw_date').nullable();
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS "savings_status"')
    this.schema.dropTable(this.tableName)
  }
}