import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      // Simple cleanup without complex queries
      await db.rawQuery(`
        DELETE FROM plan_transactions 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM plan_transactions 
          GROUP BY receipt_id
        )
      `)
      
      await db.rawQuery(`
        DELETE FROM wallet_transactions 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM wallet_transactions 
          GROUP BY reference
        )
      `)
    })
  }

  async down() {
    // Cannot restore deleted duplicates
  }
}