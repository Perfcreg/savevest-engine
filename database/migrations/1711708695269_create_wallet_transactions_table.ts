import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('wallet_id').unsigned().references('wallets.id').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
      table.decimal('amount', 15, 2).notNullable();
      table.enum('transaction_type', ['DEPOSIT','WITHDRAWAL','TRANSFER','TRANSFER_REVERSAL','INTEREST']).notNullable();
      table.string('reference').notNullable().unique(); // Make reference unique to prevent duplicates
      table.json('metadata').nullable(); // Store additional transaction data
      table.string('status').defaultTo('completed'); // Track transaction status
      table.timestamp('transaction_date').defaultTo(this.now());
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}