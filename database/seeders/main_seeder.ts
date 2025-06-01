import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Run seeders in the correct order to maintain data relationships
    await this.runSeeder(await import('#database/seeders/role_seeder'))
    await this.runSeeder(await import('#database/seeders/saving_type_seeder'))
    await this.runSeeder(await import('#database/seeders/user_seeder'))
    await this.runSeeder(await import('#database/seeders/plan_type_seeder'))
    await this.runSeeder(await import('#database/seeders/plan_seeder'))
    await this.runSeeder(await import('#database/seeders/wallet_seeder'))
    await this.runSeeder(await import('#database/seeders/wallet_transaction_seeder'))
    await this.runSeeder(await import('#database/seeders/plan_transaction_seeder'))
    await this.runSeeder(await import('#database/seeders/plan_subscriber_seeder'))
    await this.runSeeder(await import('#database/seeders/user_bank_seeder'))
    await this.runSeeder(await import('#database/seeders/user_card_seeder'))
  }
}

