import SavingType from '#models/saving_type'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method

    await SavingType.createMany([
      {
        name: 'Ajo',
        description: 'For daily group contriution',
      },
      {
        name: 'Savings',
        description: 'For long-term savings',
      },
      {
        name: 'Investment',
        description: 'For dream vacations',
      },
    ])
  }
}