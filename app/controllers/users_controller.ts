import { updateKinValidator, updatePasswordValidator, updatePhoneNumberValidator, updatePinValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import SmsService from '#services/smsService'
import AwsService from '#services/awsService'
import GenerateTokenHelper from '#services/generateToken'

export default class UsersController {

    /**
 * @get
 * @description Get logged in user.
 * @responseBody 200 - Verification successful
 * @responseBody 401 - User not logged in
 */
    async get({ auth, response }: HttpContext) {
        const user = await auth.user!
        return response.status(200).json({ user })
    }


    /**
      * @updateGender
      * @description User update gender endpoint.
      * @responseBody 200 - User update successfully
      * @requestBody {"gender": "Male"}
      */
    async updateGender({ auth, response, request }: HttpContext) {
        // Get the logged in user
        const user = await auth.user!
        // Extract data from the request
        user.gender = request.input('gender')
        user.save()
        return response.status(204).send("success")
    }

    /**
  * @updatePassword
  * @description User Updated password.
  * @responseBody 204 - User Password  successfully
  * @requestBody {"old_password": "Password123$$", "new_password": "Nairaland007$$"}
  */
    async updatePassword({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(updatePasswordValidator)
        try {
            let user = await auth.user!
            if (user.password !== payload.old_password) throw new Error("Invalid old password")
            user.password = payload.new_password
            await user.save()
            return response.status(204).send({ message: "User password changed successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }


    /** 
      * @updatePhoneNumber
      * @description User Updated phone number.
      * @responseBody 204 - User phone successfully
      * @requestBody {"phone_number": "080341288211"}
      */
    async updatePhoneNumber({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(updatePhoneNumberValidator)
        const token = GenerateTokenHelper.generateToken(4); // Generate a 4-character token
        try {
            let user = await auth.user!
            user.phone = payload.phone_number
            const smsService = new SmsService();
            await smsService.sendTokenVerificationSMS(payload.phone_number, token)
            user.token = token
            await user.save()
            return response.status(204).send({ message: "User phone number changed successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }

    /** 
  * @updatePin
  * @description User Updated pin number.
  * @responseBody 204 - User pin successfully
  * @requestBody {"pin": "1234"}
  */
    async updatePin({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(updatePinValidator)
        try {
            let user = await auth.user!
            if (user.pin !== payload.old_pin) throw new Error("Invalid old pin")
            user.password = payload.new_pin
            await user.save()
            return response.status(204).send({ message: "User pin changed successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }

    /** 
  * @updateKin
  * @description User Updated next of kins
  * @responseBody 204 - User kins successfully updated
  * @requestBody {"next_of_kin": "Ajayi Onalaja"}
  */
    async updateKin({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(updateKinValidator)
        try {
            let user = await auth.user!
            user.next_of_kin = payload.kin
            await user.save()
            return response.status(204).send({ message: "User next of kin changed successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }


    /** 
* @update2fa
* @description User Updated two factor authentication
* @responseBody 204 - User 2fa updated successfully 
* @requestBody {"2fa": true}
*/
    async update2fa({ auth, response, request }: HttpContext) {
        try {
            let user = await auth.user!
            user.fa = request.input('2fa')
            await user.save()
            return response.status(204).send({ message: "User next of kin changed successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }


          /** 
      * @updatePhoto
      * @description User Updated profile picture
      * @responseBody 204 - User picture added successfully 
      * @requestBody {"photo":{"type":"string","format":"binary"}} // Expects a valid OpenAPI 3.x JSON
      */
    async updatePhoto({ auth, response, request }: HttpContext) {
        try {
            let user = await auth.user!
            let photo = request.file('photo')
            const upload = new AwsService()
            const fileName = photo?.clientName ?? `${user.fullName}.jpg`;
            const path = await upload.uploadImageToS3(photo, fileName)
            user.picture = path
            await user.save()
            return response.status(204).send({ message: "User Picture profile set successfully successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }

    async updateBvn({ auth, response, request }: HttpContext) {

    }

    async updateNin({ auth, response, request }: HttpContext) {

    }
}