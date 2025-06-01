import UserCard from '#models/user_card'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Generate random tokens and signatures
    const generateToken = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const generateSignature = () => Math.random().toString(36).substring(2, 10)
    
    // Write your database queries inside the run method
    await UserCard.createMany([
      {
        userId: 6, // Client user
        cardType: 'VISA',
        lastFour: '4242',
        signature: generateSignature(),
        expire: '12/25',
        token: generateToken(),
      },
  
     
    ])
  }
}