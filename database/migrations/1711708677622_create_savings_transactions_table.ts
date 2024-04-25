import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'savings_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
      table.integer('savings_id').unsigned().references('savings.id').onDelete('CASCADE');
      table.decimal('amount', 15, 2).notNullable();
      table.enum('transaction_type', ['DEPOSIT', 'WITHDRAWAL']).notNullable();
      table.string('reference').notNullable();
      table.timestamp('transaction_date').defaultTo(this.now());
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}