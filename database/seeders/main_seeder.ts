import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class MainSeeder extends BaseSeeder {
  async run() {
    // Run seeders in the correct order to maintain data relationships
    const { default: RoleSeeder } = await import('#database/seeders/role_seeder')
    const { default: SavingTypeSeeder } = await import('#database/seeders/saving_type_seeder')
    const { default: UserSeeder } = await import('#database/seeders/user_seeder')
    const { default: PlanTypeSeeder } = await import('#database/seeders/plan_type_seeder')
    const { default: PlanSeeder } = await import('#database/seeders/plan_seeder')
    const { default: WalletSeeder } = await import('#database/seeders/wallet_seeder')
    const { default: WalletTransactionSeeder } = await import('#database/seeders/wallet_transaction_seeder')
    const { default: PlanTransactionSeeder } = await import('#database/seeders/plan_transaction_seeder')
    const { default: PlanSubscriberSeeder } = await import('#database/seeders/plan_subscriber_seeder')
    const { default: UserBankSeeder } = await import('#database/seeders/user_bank_seeder')
    const { default: UserCardSeeder } = await import('#database/seeders/user_card_seeder')

    await this.runSeeder(RoleSeeder)
    await this.runSeeder(SavingTypeSeeder)
    await this.runSeeder(UserSeeder)
    await this.runSeeder(PlanTypeSeeder)
    await this.runSeeder(PlanSeeder)
    await this.runSeeder(WalletSeeder)
    await this.runSeeder(WalletTransactionSeeder)
    await this.runSeeder(PlanTransactionSeeder)
    await this.runSeeder(PlanSubscriberSeeder)
    await this.runSeeder(UserBankSeeder)
    await this.runSeeder(UserCardSeeder)
  }
}

