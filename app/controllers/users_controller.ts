import { photoUploadValidator, updateKinValidator, updatePasswordValidator, updatePhoneNumberValidator, updatePinValidator, updateProfileValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import SmsService from '#services/smsService'
import { uploadToS3 } from '#services/awsService'
import GenerateTokenHelper from '#services/generateToken'
import hash from '@adonisjs/core/services/hash'
import app from '@adonisjs/core/services/app'
import fs from 'fs'


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
 * @updateProfile
 * @description User update Profile endpoint.
 * @requestBody {"gender": "MALE", "username": "johndoe","fullName": "John Doe", "dateOfBirth": "1990-01-01"}
 * @responseBody 200 - {"message": "Profile updated successfully"}
 * @responseBody 422 - {"errors": ["Validation error message"]}
 * @responseBody 500 - {"error": "Something went wrong" }
 */
    async updateProfile({ auth, response, request }: HttpContext) {
        try {
            // Validate the request payload
            const payload = await request.validateUsing(updateProfileValidator)
            // Get the logged-in user
            const user = await auth.authenticate()

            user.username = payload.username,
                user.dob = payload.dateOfBirth,
                user.fullName = payload.fullName,
                user.gender = payload.gender,
                await user.save()

            return response.status(200).send({ message: 'Profile updated successfully' })
        } catch (error) {
            console.log(error)
            if (error.messages) {
                // Validation error
                return response.status(422).send({ errors: error.messages })
            }
            return response.status(500).send({ error: 'Something went wrong' })
        }
    }

    /**
      * @updatePassword
      * @description User change password endpoint.
      * @responseBody 200 - {"message": "Password updated successfully"}
      * @responseBody 400 - {"error": "Incorrect old password"}
      * @responseBody 422 - {"errors": "Validation error message"}
      * @responseBody 500 - {"error": "Something went wrong" }
      * @requestBody {"oldPassword": "oldpassword123","newPassword": "newpassword123","confirmPassword": "newpassword123"}
     */
    async updatePassword({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(updatePasswordValidator)
        try {
            // Get the logged-in user
            const user = await auth.authenticate()

            // Verify the old password
            const isSame = await hash.verify(user.password, payload.oldPassword)
            if (!isSame) {
                return response.status(400).send({ error: 'Incorrect old password' })
            }

            // Update to the new password
            user.password = payload.newPassword
            await user.save()

            return response.status(200).send({ message: 'Password changed successfully' })
        } catch (error) {
            if (error.messages) {
                // Validation error
                return response.status(422).send({ errors: error.messages })
            }

            // General error
            return response.status(500).send({ error: 'Something went wrong' })
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
   * @uploadPhoto
   * @description Handle photo upload
   * @requestFormDataBody {"picture":{"type":"string","format":"binary"}} // Expects a valid OpenAPI 3.x JSON
   * @responseBody 200 - Photo uploaded successfully
   * @responseBody 400 - Validation error
   * @responseBody 500 - Error uploading photo
   */
    async uploadPhoto({ auth, request, response }: HttpContext) {

        const payload = await request.validateUsing(photoUploadValidator)

        const photo = payload.photo
        // // Ensure the user is authenticated
        const user = await auth.authenticate();
        if (!user) {
            return response.status(401).json({ message: 'Authentication failed' });
        }

        if (photo.type != "image") {
            return response.badRequest({ message: 'Invalid file type. Only images are allowed.' });
        }
        // Prepare the file for upload, using a unique filename for security
        // Placeholder for S3 upload logic
        
        const uniqueFileName = `${Date.now()}-${photo.clientName}`;
        const filePath = app.makePath('uploads', uniqueFileName);
        await photo.move(app.makePath('uploads'), {
            name: uniqueFileName,
            overwrite: true,
        })
        const fileType = photo.type
        const readable = fs.createReadStream(filePath)
        try {

          
            // Upload the photo to S3 (mock)
            const s3Response = await uploadToS3({ name: uniqueFileName, content: readable, contentType: fileType });

            user.picture = s3Response.Location;
            // Placeholder for user photo update logic
            await user.save();


            // Return success response
            return response.status(200).json({
                message: 'Photo uploaded successfully',
                url: s3Response.Location,
            });
        } catch (error) {
            // Log the error details for internal diagnostics (use a proper logging library in production)
            console.error('Error uploading photo:', error);

            // Return a generic error response to the client
            return response.status(500).json({
                message: 'Error uploading photo',
                error: 'An internal error occurred. Please try again later.',
            });
        }
    }



    // async updateBvn({ auth, response, request }: HttpContext) {

    // }

    // async updateNin({ auth, response, request }: HttpContext) {

    // 
}