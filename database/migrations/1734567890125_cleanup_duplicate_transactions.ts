import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // This migration is replaced by 1734567890126_manual_cleanup_duplicates
    // Left empty to avoid conflicts
  }

  async down() {
    // Cannot restore deleted duplicates
  }
}