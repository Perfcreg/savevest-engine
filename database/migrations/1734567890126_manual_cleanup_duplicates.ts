import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      // Check for NULL values and duplicates
      const nullReceipts = await db.rawQuery('SELECT COUNT(*) as count FROM plan_transactions WHERE receipt_id IS NULL')
      console.log('NULL receipt_ids:', nullReceipts)
      
      const nullRefs = await db.rawQuery('SELECT COUNT(*) as count FROM wallet_transactions WHERE reference IS NULL')
      console.log('NULL references:', nullRefs)
      
      // Delete rows with NULL receipt_id
      await db.rawQuery('DELETE FROM plan_transactions WHERE receipt_id IS NULL')
      
      // Delete rows with NULL reference
      await db.rawQuery('DELETE FROM wallet_transactions WHERE reference IS NULL')
      
      // Now clean duplicates
      await db.rawQuery(`
        WITH duplicates AS (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY receipt_id ORDER BY id) as rn
          FROM plan_transactions
        )
        DELETE FROM plan_transactions WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
      `)
      
      await db.rawQuery(`
        WITH duplicates AS (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY reference ORDER BY id) as rn
          FROM wallet_transactions
        )
        DELETE FROM wallet_transactions WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
      `)
      
      // Add columns first
      await db.rawQuery('ALTER TABLE plan_transactions ADD COLUMN IF NOT EXISTS metadata JSON')
      await db.rawQuery('ALTER TABLE plan_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT \'completed\'')
      await db.rawQuery('ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS metadata JSON')
      await db.rawQuery('ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT \'completed\'')
      
      // Add constraints if they don't exist
      try {
        await db.rawQuery('ALTER TABLE plan_transactions ADD CONSTRAINT plan_transactions_receipt_id_unique UNIQUE (receipt_id)')
      } catch (e) {
        console.log('Plan constraint already exists')
      }
      
      try {
        await db.rawQuery('ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_reference_unique UNIQUE (reference)')
      } catch (e) {
        console.log('Wallet constraint already exists')
      }
    })
  }

  async down() {
    // Cannot restore deleted duplicates
  }
}