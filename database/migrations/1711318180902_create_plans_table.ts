import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('description').notNullable()
      table.integer('plan_type_id').unsigned().references('id').inTable('plan_types')
      table.float('target_amount', 10, 2).notNullable();
      table.string('plan_code').notNullable()
      table.float('amount', 10, 2).notNullable();
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.enum('interval', ['DAILY', 'WEEKLY', 'MONTHLY'], {
        useNative: true,
        enumName: 'plan_interval',
        existingType: false,
      }).notNullable()
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.float('interest_earned').notNullable()
      table.decimal('interest_rate').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS "plan_interval"')
    this.schema.dropTable(this.tableName)
  }
}