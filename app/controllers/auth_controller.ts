import type { HttpContext } from '@adonisjs/core/http'
import GenerateTokenHelper from '#services/generateToken'
import SmsService from '#services/smsService'
import PaystackService from '#services/paystackService'

import {
  registerValidator,
  loginValidator,
  verifyTokenValidator,
  forgetPasswordValidator,
  resetPasswordalidator
} from '#validators/auth'
import User from '#models/user'
import Wallet from '#models/wallet'
export default class AuthController {

  
  /**
  * @register
  * @description User registration endpoint.
  * @responseBody 201 - User Created successfully
  * @responseBody 403  - User Data Exists
  * @requestBody {"full_name": "Melinda Gates", "email": "usernew1@mail.com", "password": "faf&w22334", "phone": "81345323222", "referal": "BXANGH"}
  */
  async register({ request, response }: HttpContext) {
    //  Validate the request body against the schema defined in validator.ts file
    const { ...payload } = await request.validateUsing(registerValidator)
    // Generate 4 unique tokens for each user and store them to database'

    const token = GenerateTokenHelper.generateToken(4); // Generate a 10-character token
    const referal_code = GenerateTokenHelper.generateAlphanumeric(6)
    try {
      let user = await User.findBy('email', payload.email)
      if (user) throw new Error("User with this email already registered")
      // Validate the mobile number if the user already exists
      let mobile = await User.findBy('phone', payload.phone)
      if (mobile) throw new Error("Mobile number already registered")
      // save the user data
      const newUser = new User();
      newUser.phone = payload.phone;
      newUser.email = payload.email.toLowerCase();
      newUser.password = payload.password;
      newUser.fullName = payload.full_name
      newUser.referal = payload.referal || '';
      if (
        payload.email == 'demo1@savevesting.com'
        || payload.email == 'demo2@savevesting.com'
        || payload.email == 'demo3@savevesting.com'
      ) {
        newUser.token = '123456'
      } else {
        newUser.token = token
        // const smsService = new SmsService();
        // await smsService.sendTokenVerificationSMS(payload.phone, token)
      }
      newUser.referal = `SV${referal_code}`
      await newUser.save()
      return response.status(201).send({ message: "User created Successfully" })
    } catch (e) {
      return response.forbidden(e.message)
    }
  }

  /**
     * @login
     * @description User login endpoint.
     * @responseBody 200 - Authentication successful, returns access token
     * @responseBody 401 - Invalid credentials
     * @responseBody 403 - User is not active or is permanently inactive
     * @requestBody {"email": "user@example.com", "password": "password123"}
 */
  async login({ request, response }: HttpContext) {
    const { ...payload } = await request.validateUsing(loginValidator)
    try {
      // Attempt to authenticate the user
      const user = await User.verifyCredentials(payload.email.toLowerCase(), payload.password)
      const accessToken = await User.accessTokens.create(user)
      // Check if the user is active and not permanently inactive
      if (user.isActive && !user.inactivePermantely) {
        return response.status(200).send({ accessToken })
      } else {
        return response.status(403).send({ message: 'User is not active or is permanently inactive.' })
      }
    } catch (error) {
      return response.status(401).send({ message: 'Invalid credentials.' })
    }
  }


  /**
   * @resetPassword
   * @description User reset-password endpoint.
   * @responseBody 200 - Password reset successful
   * @responseBody 400 - Invalid Password format
   * @responseBody 500 - Internal server error
   * @requestBody {"password": "Naira007$$", confirm_password: "Naira007$$"}
 */
  async resetPassword({ auth, request, response }: HttpContext) {
    const { ...payload } = await request.validateUsing(resetPasswordalidator)
    try {
      const user = await auth.user!
      user.password = payload.password
      user.save()
      return response.status(200).send({ message: 'Password reset successfully' })
    } catch (e) {
      return response.forbidden(e.message)
    }
  }

  /**
    * @forgetPassword
    * @description User forget-password endpoint.
    * @responseBody 200 - Password reset request successful
    * @responseBody 400 - Invalid phone number format
    * @responseBody 404 - User not found
    * @responseBody 500 - Internal server error
    * @requestBody {"phoneNumber": "08034567890"}
  */
  async forgetPassword({ request, response }: HttpContext) {
    const { phoneNumber } = await request.validateUsing(forgetPasswordValidator)
    const token = GenerateTokenHelper.generateToken(4); // Generate a 10-character token
    try {
      let user = await User.findBy('phoneNumber', phoneNumber)
      if (!user) {
        throw new Error("User with this phone nuber not found")
      }
      const smsService = new SmsService();
      await smsService.sendTokenVerificationSMS(phoneNumber, token)
      user.token = token
      user.save()
      return response.status(200).send({ message: "Password reset verification sent" })
    } catch (e) {
      return response.forbidden(e.message)
    }
  }

  /**
     * @verifyPhone
     * @description Verify a token.
     * @responseBody 200 - Verification successful and create Paystack wallet
     * @responseBody 400 - Invalid token or token mismatch
     * @requestBody {"token": "1234"}
  */
  async verifyPhone({ request, response }: HttpContext) {
    const { token } = await request.validateUsing(verifyTokenValidator)
    try {
      let user = await User.findBy('token', token)
      // Check if user token matches provided token
      if (!user) throw new Error("Invalid Token")
      user.token = ''
      user.isActive = true
      const paystackService = new PaystackService();
      const createWallet =  await paystackService.createCustomer(user.email, user.fullName.split (' ')[0], user.fullName.split (' ')[1], user.phone)
      const wallet = new Wallet()
      wallet.amount = 0.0
      user.paystack_id = createWallet.customer_code
      await user.related('wallet').save(wallet)
      await user.save()
      return response.status(200).send({ message: "Phone verification suucsses" })
    } catch (e) {
      return response.forbidden(e.message)
    }
  }
}