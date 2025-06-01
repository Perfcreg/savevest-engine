import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plan_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('plan_id').unsigned().references('plans.id')
      table.integer('user_id').unsigned().references('users.id')
      table.float('amount').notNullable()
      table.string('receipt_id').notNullable()
      table.string('transaction_id').notNullable()
      table.string('transaction_type').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}