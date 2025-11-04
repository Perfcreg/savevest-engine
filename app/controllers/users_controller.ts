import { bvnValidator, createPinValidator, photoUploadValidator, updateKinValidator, updatePasswordValidator, updatePhoneNumberValidator, updatePinValidator, updateProfileValidator, verifyPinValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import SmsService from '#services/smsService'
import { uploadToS3 } from '#services/awsService'
import GenerateTokenHelper from '#services/generateToken'
import hash from '@adonisjs/core/services/hash'
import app from '@adonisjs/core/services/app'
import fs, { ReadStream } from 'fs'
import IncentiveService from '#services/incentiveService'
import PaystackService from '#services/paystackService'
import UserBank from '#models/user_bank'
export default class UsersController {
    /**
     * @getUserIncentives
     * @description Get user referral incentives
     * @responseBody 200 - {"message": "User incentives retrieved successfully", "data": {"totalIncentives": 150}}
     * @responseBody 500 - {"message": "Error retrieving user incentives", "error": "Error message"}
     */
    async getUserIncentives({ auth, response }: HttpContext) {
        try {
            const user = auth.user!
            const totalIncentives = await IncentiveService.getUserTotalIncentives(user.id)
            return response.status(200).json({
                message: 'User incentives retrieved successfully',
                data: { totalIncentives }
            })
        } catch (error) {
            return response.status(500).json({
                message: 'Error retrieving user incentives',
                error: error.message
            })
        }
    }


    /**
     * @get
     * @description Get logged in user profile
     * @responseBody 200 - {"user": {"id": 1, "firstName": "John", "lastName": "Doe", "email": "john@example.com"}}
     * @responseBody 401 - {"message": "Authentication required"}
     */
    async get({ auth, response }: HttpContext) {
        const user = await auth.user!
        await user?.load('role')
        return response.status(200).json({ user })
    }

    /**
     * @updateProfile
     * @description Update user profile information
     * @requestBody {"gender": "male", "username": "johndoe", "firstName": "John", "lastName": "Doe", "dateOfBirth": "1990-01-01"}
     * @responseBody 200 - {"message": "Profile updated successfully"}
     * @responseBody 422 - {"errors": ["Validation error message"]}
     * @responseBody 500 - {"error": "Something went wrong"}
     */
    async updateProfile({ auth, response, request }: HttpContext) {
        try {
            // Validate the request payload
            const payload = await request.validateUsing(updateProfileValidator)
            // Get the logged-in user
            const user = await auth.authenticate()

            user.username = payload.username
            user.dob = payload.dateOfBirth
            user.firstName = payload.firstName
            user.lastName = payload.lastName
            user.gender = payload.gender
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
     * @description Change user password
     * @requestBody {"oldPassword": "oldpassword123", "newPassword": "newpassword123"}
     * @responseBody 200 - {"message": "Password changed successfully"}
     * @responseBody 400 - {"error": "Incorrect old password"}
     * @responseBody 422 - {"errors": ["Validation error message"]}
     * @responseBody 500 - {"error": "Something went wrong"}
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
     * @description Update user phone number with SMS verification
     * @requestBody {"phone_number": "08034567890"}
     * @responseBody 204 - {"message": "User phone number changed successfully"}
     * @responseBody 403 - {"message": "Error message"}
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
     * @createPin
     * @description Create user transaction PIN
     * @requestBody {"pin": "1234", "confirm_pin": "1234"}
     * @responseBody 200 - {"message": "User pin Added successfully"}
     * @responseBody 400 - {"message": "You have already created a pin"}
     * @responseBody 403 - {"message": "Error message"}
     */
    async createPin({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(createPinValidator)
        try {
            let user = await auth.user!
            if (user.pin != null) {
                return response.status(400).json({
                    message: "You have already created a pin"
                })
            }
            function isSimplePin(pin: string) {
                const simplePins = [
                    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
                    '1234', '2345', '3456', '4567', '5678', '6789', '0123', '1122', '2233', '3344',
                    '4455', '5566', '6677', '7788', '8899'
                ];

                return simplePins.includes(pin);
            }

            if (isSimplePin(payload.pin)) {
                return response.status(400).json({
                    message: "Invalid Pin Combination, chooose someting different"
                })
            }

            user.pin = payload.pin
            await user.save()
            return response.status(200).send({ message: "User pin Added successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }

    /**
     * @verifyPin
     * @description Verify user transaction PIN
     * @requestBody {"pin": "1234"}
     * @responseBody 200 - {"message": "User pin verify"}
     * @responseBody 400 - {"message": "You have not created a pin"}
     * @responseBody 403 - {"message": "Invalid Pin"}
     */

    async verifyPin({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(verifyPinValidator)
        try {
            let user = await auth.user!
            if (user.pin == null) {
                return response.status(400).json({
                    message: "You have not created a pin"
                })
            }

            if (user.pin !== payload.pin) {
                return response.status(403).send({ message: "Invalid Pin" })
            }
            return response.status(200).send({ message: "User pin verify" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }

    /**
     * @updatePin
     * @description Update user transaction PIN
     * @requestBody {"old_pin": "1234", "new_pin": "5678"}
     * @responseBody 200 - {"message": "User pin changed successfully"}
     * @responseBody 400 - {"message": "Invalid Pin Combination, choose something different"}
     * @responseBody 403 - {"message": "Error message"}
     */
    async updatePin({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(updatePinValidator)
        try {
            let user = await auth.user!
            if (user.pin !== payload.old_pin) {
                return response.status(400).json({
                    message: "Invalid Pin Combination, chooose someting different"
                })
            }
            if (user.pin == payload.new_pin) {
                return response.status(400).json({
                    message: "Use a different Pin"
                })
            }
            function isSimplePin(pin: string) {
                const simplePins = [
                    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
                    '1234', '2345', '3456', '4567', '5678', '6789', '0123', '1122', '2233', '3344',
                    '4455', '5566', '6677', '7788', '8899'
                ];

                return simplePins.includes(pin);
            }

            if (isSimplePin(payload.new_pin)) {
                return response.status(400).json({
                    message: "Invalid Pin Combination, chooose someting different"
                })
            }
            user.pin = payload.new_pin
            await user.save()
            return response.status(200).send({ message: "User pin changed successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }

    /**
     * @updateKin
     * @description Update user next of kin information
     * @requestBody {"kin": "John Doe"}
     * @responseBody 200 - {"message": "User next of kin changed successfully"}
     * @responseBody 403 - {"message": "Error message"}
     */
    async updateKin({ auth, response, request }: HttpContext) {
        const { ...payload } = await request.validateUsing(updateKinValidator)
        try {
            let user = await auth.user!
            user.next_of_kin = payload.kin
            await user.save()
            return response.status(200).send({ message: "User next of kin changed successfully" })
        } catch (e) {
            return response.forbidden(e.message)
        }
    }


    /**
     * @update2fa
     * @description Update two-factor authentication setting
     * @requestBody {"2fa": true}
     * @responseBody 204 - {"message": "User 2FA updated successfully"}
     * @responseBody 403 - {"message": "Error message"}
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
     * @description Upload user profile photo
     * @requestFormDataBody {"photo": {"type": "string", "format": "binary"}}
     * @responseBody 200 - {"message": "Photo uploaded successfully", "url": "https://s3.amazonaws.com/photo.jpg"}
     * @responseBody 400 - {"message": "Invalid file type. Only images are allowed."}
     * @responseBody 401 - {"message": "Authentication failed"}
     * @responseBody 500 - {"message": "Error uploading photo"}
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
        const streamToBuffer = async (stream: ReadStream): Promise<Buffer> => {
            const chunks: Uint8Array[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        };

        const readable = fs.createReadStream(filePath)
        const fileBuffer = await streamToBuffer(readable);
        try {
            // Upload the photo to S3 (mock)
            const s3Response = await uploadToS3({ name: uniqueFileName, content: fileBuffer, contentType: fileType });

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

    /**
     * @updateKyc
     * @description Submit KYC verification with BVN
     * @requestBody {"bvn": "12345678901"}
     * @responseBody 200 - {"message": "KYC Verification submitted, Paystack system will handle it"}
     * @responseBody 400 - {"message": "KYC Verification Failed"}
     */
    async updateKyc({ auth, response, request }: HttpContext) {
        try {
            const user = await auth.authenticate();
            const payload = await request.validateUsing(bvnValidator)
            const paystack = new PaystackService()
            const verifyUser = await paystack.validateCustomer({
                id: user.paystack_id,
                country: 'NG',
                type: 'bvn',
                value: payload.bvn,
                first_name: user.firstName,
                last_name: user.lastName
            })

           console.log(user.paystack_id, verifyUser)
            return response.status(200).send({
                message: 'KYC Verification submitted, Our system will send a notification shortly'
            })
        } catch (error) {
            console.log(error)
            return response.status(400).send({
                message: 'KYC Verification Failed'
            })
        }
    }
}