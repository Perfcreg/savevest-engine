
import { HttpContext } from '@adonisjs/core/http';
import PaystackService from '#services/paystackService'; // Replace 'path-to-paystack-service' with the actual path
import UserCard from '#models/user_card'
import { createCardValidator, updateCardValidator } from '#validators/user_card'; // Replace 'path-to-card-validator' with the actual path
import GenerateTokenHelper from '#services/generateToken';

export default class UserCardController {

  /**
   * @getCard
   * @description get User Cards
   * @responseBody 200 - {UserCard}
   * @responseBody 400 - Bad request
   * @responseBody 403 - Forbidden
   */
  async getCards({ auth, response }: HttpContext) {
    const user = await auth.authenticate()
    const userCards = await UserCard.query().where('user_id', user.id)
    return response.status(200).json({ userCards })
  }
  /**
   * @addCard
   * @description Add a new card to Paystack and save to user_cards table.
   * @responseBody 201 - Card added successfully
   * @requestBody {card_number: "4084084084084081", cvv: "408", expiry_month: "10", expiry_year: "29"}
   * @responseBody 400 - Bad request
   * @responseBody 403 - Forbidden
   */

  private transformCardData(data: any) {
    const { card_number, expiry_month, cvv } = data;

    // Remove spaces from card number
    const cleanCardNumber = card_number.replace(/\s/g, '');

    // Split expiry date
    const [month, year] = expiry_month.split('/');

    return {
      card_number: cleanCardNumber,
      cvv,
      expiry_month: month,
      expiry_year: year.length === 2 ? `20${year}` : year,
    };
  }
  async addCard({ auth, request, response }: HttpContext) {
    const { card_number, cvv, expiry_month } = await request.validateUsing(createCardValidator);

    try {
      const user = auth.user!;
      const paystackService = new PaystackService();
      const cardData: any = {
        card_number,
        expiry_month,
        cvv
      };
      const data = this.transformCardData(cardData);

      // Step 1: Tokenize the card
      const tokenizeResponse = await paystackService.tokenizeCard(user.email, data);

      if (!tokenizeResponse.status || !tokenizeResponse.data) {
        throw new Error(`Tokenization failed: ${tokenizeResponse.message || 'Unknown error'}`);
      }

      // // Step 2: Charge the card using the authorization code from the tokenization step
      const chargeResponse = await paystackService.chargeCard(
        user.email,
        5000, // Charge a small amount like 50 NGN
        tokenizeResponse.data.authorization_code,
      );

      if (!chargeResponse.status || !chargeResponse.data || !chargeResponse.data.authorization) {
        throw new Error(`Charge failed: ${chargeResponse.message || 'Unknown error'}`);
      }

      // Process the successful charge and save the card
      const userCard = new UserCard();
      userCard.userId = user.id;
      userCard.cardType = chargeResponse.data.authorization.card_type;
      userCard.lastFour = chargeResponse.data.authorization.last4;
      userCard.token = chargeResponse.data.authorization.authorization_code;
      userCard.signature = chargeResponse.data.authorization.signature;
      userCard.expire = `${chargeResponse.data.authorization.exp_month}/${chargeResponse.data.authorization.exp_year.substring(2)}`;
      await userCard.save();

      // Refund the charge
      await paystackService.refundTransaction(chargeResponse.data.id, 5000);

      return response.status(201).send({
        message: 'Card added successfully',
      });
    } catch (error) {
      console.error('Error in addCard:', error);
      return response.status(500).send({
        message: 'An error occurred while processing your request',
        error: error.message
      });
    }
  }



  /**
   * @getCardTransactions
   * @description Fetch  all card transaction on user cards table.
   * @responseBody 200 - OK
   * @responseBody 400 - Bad request
   * @responseBody 403 - Forbidden
   */

  async getCardTransactions({ auth, response }: HttpContext) {
    const user = auth.user!;
    // const userCards = await UserCard.query().where('user_id', user.id)
    try {
      const paystackService = new PaystackService();
      const paystackTransactions = await paystackService.fetchTransactions({
        page: 1,
        perPage: 10,
      })
      const transactions = paystackTransactions.filter((transaction: { channel: string; customer: { customer_code: string; }; }) =>
        transaction.channel === "card" &&
        transaction.customer && // Ensure customer object exists
        transaction.customer.customer_code === user.paystack_id
      );

      return response.status(200).json({ transactions })
    } catch (error) {
      return response.status(400).send({ message: error.message });
    }
  }

  /**
   * @updateCard
   * @description Update an existing card for the authenticated user.
   * @routeParam id - The ID of the card to be updated.
   * @responseBody 200 - Card updated successfully
   * @requestBody {card_number: "4084084084084081", cvv: "408", expiry_month: "10", expiry_year: "22"}
   * @responseBody 400 - Bad request
   */
  async updateCard({ auth, request, response, params }: HttpContext) {
    const user = auth.user!;
    const cardId = params.id;
    const { ...payload } = await request.validateUsing(updateCardValidator);

    try {
      const paystackService = new PaystackService();
      const oldCard = await UserCard.findOrFail(cardId);
      
      if (oldCard.userId !== user.id) {
        return response.status(403).send({ message: 'Forbidden' });
      }

      // Tokenize the new card
      const cardData: any = {
        card_number : payload.card_number,
        expiry_month: payload.expiry_month,
        cvv: payload.cvv
      };
      const data = this.transformCardData(cardData);

      // Step 1: Tokenize the card
      const tokenResponse = await paystackService.tokenizeCard(user.email, data);
      if (!tokenResponse.status || !tokenResponse.data) {
        throw new Error(`Tokenization failed: ${tokenResponse.message || 'Unknown error'}`);
      }

      // Verify the new card by charging a small amount (50 kobo)
      const chargeResponse = await paystackService.chargeCard(
        user.email,
        5000, // Charge a small amount like 50 NGN
        tokenResponse.data.authorization_code,
      );

      if (!chargeResponse.status || !chargeResponse.data) {
        throw new Error(`Charge failed: ${chargeResponse.message || 'Unknown error'}`);
      }

      try {
        // Update the card details
        oldCard.cardType = chargeResponse.data.authorization.card_type;
        oldCard.lastFour = chargeResponse.data.authorization.last4;
        oldCard.token = chargeResponse.data.authorization.authorization_code;
        oldCard.signature = chargeResponse.data.authorization.signature;
        oldCard.expire = `${chargeResponse.data.authorization.exp_month}/${chargeResponse.data.authorization.exp_year.substring(2)}`;
        await oldCard.save();

        // Find and update associated plans
        await this.updateAssociatedPlans(user.id, user.email, oldCard.token, tokenResponse.authorization_code);

        // Refund the verification charge
        await paystackService.refundTransaction(chargeResponse.data.id, 5000);
      
        return response.status(200).send({
          message: 'Card updated successfully and associated plans have been updated',
          data: oldCard,
        });
      } catch (updateError) {
        // If there's an error during update, attempt to refund the charge
        await paystackService.refundTransaction(chargeResponse.data.id, 5000);
        throw updateError;
      }
    } catch (error) {
      console.error('Error updating card:', error);
      if (error.message.includes('Card tokenization failed') || error.message.includes('Card verification failed')) {
        return response.status(400).send({ message: 'Unable to process the new card. Please check the card details and try again.' });
      }
      return response.status(400).send({ message: error.message });
    }
  }

  private async updateAssociatedPlans(userId: number, userEmail: string, oldAuthorizationCode: string, newAuthorizationCode: string) {
    const paystackService = new PaystackService();
    const subscriptions = await paystackService.listSubscriptions(userEmail);
    console.log(newAuthorizationCode)
    for (const subscription of subscriptions) {
      try {
        // Update the subscription with the new authorization code
        await paystackService.enableSubscription(subscription.subscription_code, newAuthorizationCode);
        
        // Update the subscription in your database
        await this.updateSubscriptionInDatabase(userId, subscription.subscription_code, newAuthorizationCode);
      } catch (error) {
        console.error(`Failed to update subscription ${subscription.subscription_code}:`, error);
        // Implement error handling or retry logic here
      }
    }
    // console.log(subscriptions)
  }


  private async updateSubscriptionInDatabase(userId: number, subscriptionCode: string, newAuthorizationCode: string) {
    const PlanSubscriber = (await import('#models/plan_subcriber')).default;

    const planSubscriber = await PlanSubscriber.query()
      .where('user_id', userId)
      .where('subscription_code', subscriptionCode)
      .first();

    if (planSubscriber) {
      planSubscriber.emailToken = newAuthorizationCode;
      await planSubscriber.save();
    }
  }

  /**
   * @deleteCard
   * @description Delete a card for the authenticated user.
   * @routeParam id - The ID of the card to be deleted.
   * @responseBody 200 - Card deleted successfully
   * @responseBody 403 - Forbidden
   */
  async deleteCard({ auth, response, params }: HttpContext) {
    const user = auth.user!;
    const cardId = params.id;

    try {
      const userCard = await UserCard.findOrFail(cardId);
      if (userCard.userId !== user.id) {
        return response.status(403).send({ message: 'Forbidden' });
      }

      await userCard.delete();

      return response.status(200).send({
        message: 'Card deleted successfully',
      });
    } catch (error) {
      return response
    }
  }
}