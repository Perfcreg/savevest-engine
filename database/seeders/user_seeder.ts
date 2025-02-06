import User from '#models/user'
import GenerateTokenHelper from '#services/generateToken'
// import { Hash } from '@adonisjs/core/hash'
import { BaseSeeder } from '@adonisjs/lucid/seeders'


const referal_code = GenerateTokenHelper.generateAlphanumeric(6)

export default class extends BaseSeeder {

  async run() {
    // Write your database queries inside the run method
    await User.createMany([

      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password123',
        phone: '1234567890',
        username: 'admin',
        role_id: 1, // Assuming role_id 1 is for admin
        referal: `SV${referal_code}`,
        isActive: true,
      },

      {
        firstName: 'Accountant',
        lastName: 'User',
        email: 'accountant@example.com',
        password: 'password123',
        phone: '1234567891',
        username: 'accountant',
        role_id: 2, // Assuming role_id 2 is for accountant
        referal: `SV${referal_code}`,
        isActive: true
      },

      {
        firstName: 'Auditor',
        lastName: 'User',
        email: 'auditor@example.com',
        password: 'password123',
        phone: '1234567892',
        username: 'auditor',
        role_id: 3, // Assuming role_id 3 is for auditor
        referal: `SV${referal_code}`,
        isActive: true,
      },

      {
        firstName: 'Analyst',
        lastName: 'User',
        email: 'analyst@example.com',
        password: 'password123',
        phone: '1234567893',
        username: 'analyst',
        role_id: 4, // Assuming role_id 4 is for analyst
        referal: `SV${referal_code}`,
        isActive: true,
      },

      {
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@example.com',
        password: 'password123',
        phone: '1234567894',
        username: 'manager',
        role_id: 5, // Assuming role_id 5 is for manager
        referal: `SV${referal_code}`,
        isActive: true,
      },

      {
        firstName: 'Client',
        lastName: 'User',
        email: 'client@example.com',
        password: 'password123',
        phone: '1234567895',
        username: 'client',
        role_id: 6, // Assuming role_id 6 is for client
        referal: `SV${referal_code}`,
        isActive: true,
      },

      
    ])
  }
}