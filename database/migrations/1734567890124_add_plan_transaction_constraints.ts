import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plan_transactions'

  async up() {
    // Skip - columns and constraints handled in cleanup migration
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['receipt_id'], 'plan_transactions_receipt_id_unique')
      table.dropColumn('metadata')
      table.dropColumn('status')
    })
  }
}