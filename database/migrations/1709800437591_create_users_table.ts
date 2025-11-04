import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('role_id').references('roles.id').defaultTo(6)
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('phone', 15).notNullable().unique()
      table.string('username', 40).nullable().unique()
      table.string('token', 4).nullable()
      table.integer('referal_by').references('users.id').nullable()// delete profile when user is deleted
      table.string('referal', 12).nullable()
      table.integer('referral_count').defaultTo(0)
      table.decimal('referral_incentives', 10, 2).defaultTo(0)
      table.string('gender').nullable()
      table.string('next_of_kin').nullable()
      table.boolean('bvn').defaultTo(false)
      table.string('paystack_id').nullable().unique()
      table.boolean('kyc').defaultTo(false)
      table.string('pin', 4).nullable()
      table.string('picture').nullable()
      table.boolean('is_active').notNullable().defaultTo(false)
      table.boolean('inactive_permantely').notNullable().defaultTo(false)
      table.date('dob').nullable()
      table.boolean('fa').defaultTo(false)
      table.string('device_id').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
