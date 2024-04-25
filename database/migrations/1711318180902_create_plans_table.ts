import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('description').notNullable()
      table.enu('plan_type', ['SAVING', 'AJO', 'PERSONAL', 'GROUP'], {
        useNative: true,
        enumName: 'plan_type',
        existingType: false,
      }).notNullable()
      table.decimal('target_amount', 10, 2).notNullable();
      table.string('plan_code').notNullable()
      table.decimal('amount', 10, 2).notNullable();
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.enu('interval', ['DAILY', 'WEEKLY', 'MONTHLY'], {
        useNative: true,
        enumName: 'plan_interval',
        existingType: false,
      }).notNullable()
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.decimal('interest_rate').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS "plan_type"')
    this.schema.raw('DROP TYPE IF EXISTS "plan_interval"')
    this.schema.dropTable(this.tableName)
  }
}