import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('phone', 15).notNullable().unique()
      table.string('username', 40).nullable().unique()
      table.string('token', 4).notNullable()
      table.string('referal_code', 12).nullable()
      table.string('referal', 12).nullable()
      table.string('gender').nullable()
      table.string('next_of_kin').nullable()
      table.string('bvn', 15).nullable().unique()
      table.string('nin', 15).nullable().unique()
      table.string('pin', 4).nullable()
      table.string('picture').nullable()
      table.boolean('is_active').notNullable().defaultTo(false)
      table.boolean('inactive_permantely').notNullable().defaultTo(false)
      table.string('dob').nullable()
      table.boolean('fa').defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}