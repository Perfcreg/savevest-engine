import type { HttpContext } from '@adonisjs/core/http'
import PaystackService from '../helpers/paystackService.js'


export default class WalletsController {
  /**
   * Display a list of resource
   */
  async index({auth, response}: HttpContext) {
    const user = await auth.user!
    const paystackService = new PaystackService();
    const  balance = await paystackService.getCustomer(user.email);
    return response.status(200).json({balance})
  }

  /**
   * Display form to create a new record
   */
  async create({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request }: HttpContext) {}

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {}

  /**
   * Edit individual record
   */
  async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  // async update({ params, request }: HttpContext) {}

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {}
}