import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_transactions'

  async up() {
    // Skip - columns and constraints handled in cleanup migration
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['reference'], 'wallet_transactions_reference_unique')
      table.dropColumn('metadata')
      table.dropColumn('status')
    })
  }
}