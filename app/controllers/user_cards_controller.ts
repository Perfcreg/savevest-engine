
import { HttpContext } from '@adonisjs/core/http';
import PaystackService from '#services/paystackService'; // Replace 'path-to-paystack-service' with the actual path
import UserCard from '#models/user_card'
import { createCardValidator, updateCardValidator } from '#validators/user_card'; // Replace 'path-to-card-validator' with the actual path

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
   * @requestBody {card_number: "4084084084084081", cvv: "408", expiry_month: "10", expiry_year: "22"}
   * @responseBody 400 - Bad request
   * @responseBody 403 - Forbidden
   */
  async addCard({ auth, request, response }: HttpContext) {
    const { card_number, cvv, expiry_month, expiry_year } = await request.validateUsing(createCardValidator);
    const [expiryMonth, expiryYear] = expiry_year.split('/');

    try {
      const user = auth.user!;
      // Check if user already has 2 cards
      const userCardsCount = await UserCard.query().where('user_id', user.id)

      if (userCardsCount.length >= 2) {
        return response.status(400).send({ message: 'You can only add up to 2 cards.' });
      }
      const paystackService = new PaystackService();
      const card = {
        type: 'Visa',
        number: card_number,
        cvv,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
      };
      const tokenResponse = await paystackService.chargeCard(user.email, card);
      console.log(tokenResponse)
      // Check if token response is successful
      if (tokenResponse.status) {
        const userCard = new UserCard();
        userCard.userId = user.id;
        userCard.cardType = tokenResponse.data.card_type;
        userCard.lastFour = tokenResponse.data.last4;
        userCard.token = tokenResponse.data.authorization_code;
        userCard.signature = tokenResponse.data.signature;
        userCard.expire = `${tokenResponse.data.exp_month} / ${tokenResponse.data.exp_year.substring(2)}`;
        await userCard.save();
        return response.status(201).send({
          message: 'Card added successfully',
        });
      }
    } catch (error) {
      return response.status(400).send({ message: error.message });
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
      const transaction = paystackTransactions.filter(transaction => 
        transaction.channel === "card" && 
        transaction.customer && // Ensure customer object exists
        transaction.customer.customer_code === user.paystack_id
      );
      
      return response.status(200).json({ transaction })
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
   * @responseBody 403 - Forbidden
   */
  async updateCard({ auth, request, response, params }: HttpContext) {
    const user = auth.user!;
    const cardId = params.id;
    const { ...payload } = await request.validateUsing(updateCardValidator);

    try {
      const paystackService = new PaystackService();
      const tokenResponse = await paystackService.tokenizeCard(payload.card_number, payload.cvv, payload.expiry_month, payload.expiry_year);

      const userCard = await UserCard.findOrFail(cardId);
      if (userCard.userId !== user.id) {
        return response.status(403).send({ message: 'Forbidden' });
      }

      userCard.cardType = tokenResponse.card_type;
      userCard.lastFour = tokenResponse.last4;
      userCard.token = tokenResponse.authorization_code;
      await userCard.save();

      return response.status(200).send({
        message: 'Card updated successfully',
        data: userCard,
      });
    } catch (error) {
      return response.status(400).send({ message: error.message });
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