import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'
export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method

    await Role.createMany([
      {
        name: 'admin',
        description: 'Administrator with full access to all resources',
      },
      {
        name: 'accountant',
        description: 'Responsible for managing financial records',
      },
      {
        name: 'auditor',
        description: 'Responsible for auditing financial statements and records',
      },
      {
        name: 'analyst',
        description: 'Responsible for financial data analysis and reporting',
      },
      {
        name: 'manager',
        description: 'Responsible for overseeing financial operations and staff',
      },
      {
        name: 'user',
        description: 'Client with access to personal financial information',
      },
    ])
  }
}