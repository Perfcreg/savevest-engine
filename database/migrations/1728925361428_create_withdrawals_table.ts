import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'withdrawals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.decimal('amount', 10, 2).notNullable()
      table.integer('user_bank_id').unsigned().references('id').inTable('user_banks').onDelete('SET NULL')
      table.string('recipient_code').notNullable()
      table.string('transfer_code')
      table.string('transfer_reference')
      table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending')
      table.string('reference').unique().notNullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}