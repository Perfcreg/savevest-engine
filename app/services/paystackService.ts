
// @ts-ignore
import Paystack from 'paystack-api';
import env from '#start/env'
import { DateTime } from 'luxon';
import crypto from 'crypto';

class PaystackService {
    private paystack: typeof Paystack;
    constructor() {
        this.paystack = new Paystack(env.get('PAYSTACK_SECRET_KEY'));
    }

    async createCustomer(email: any, firstName: any, lastName: any, phone: any) {
        try {
            const response = await this.paystack.customer.create({
                email,
                first_name: firstName,
                last_name: lastName,
                phone,
            })
            return response.data
        } catch (error) {
            throw new Error(`Error creating customer: ${error.message}`)
        }
    }

    async verifyWebhookSignature(signature: any, body: any) {
        const hash = crypto
            .createHmac('sha512', env.get('PAYSTACK_SECRET_KEY'))
            .update(body)
            .digest('hex');
        return hash === signature;
    }

    async getCustomer(customerEmail: any) {
        try {
            const response = await this.paystack.customer.get({
                email: customerEmail,
            })
            return response.data
        } catch (error) {
            throw new Error(`Error getting wallet balance: ${error.message}`)
        }
    }

    async customerCreatePlan(name: any, amount: any, interval: any) {
        try {
            const response = await this.paystack.plan.create(name, amount, interval)
            return response.data
        } catch (error) {
            throw new Error(`Error creating plan: ${error.message}`)
        }
    }

    async getPlan(name: string) {
        try {
            const response = await this.paystack.plan.get(name)
            return response.data
        } catch (error) {
            throw new Error(`Error getting plan: ${error.message}`)
        }
    }

    async createSubscription(customer: string, plan: string, accessCode: string) {
        try {
            const params = {
                customer,
                plan,
                authorization: accessCode,
                start_date: DateTime.now().toISODate(),
                currency: 'NGN',
            };
            const { data } = await this.paystack.subscription.create(params);
            return data;
        } catch (error) {
            throw new Error(`Error Creating subscription: ${error.message}`);
        }
    }

    async getSubscription(code: string) {
        try {
            const { data } = await this.paystack.subscription.get(code)
            return data
        } catch (error) {
            throw new Error(`Error Getting subscription: ${error.message}`);

        }
    }

    async cancelSubscription(code: string, token: string) {
        try {
            const { data } = await this.paystack.subscription.disable(code, token);
            return data;
        }
        catch (error) {
            throw new Error(`Error Cancelling subscription: ${error.message}`);
        }
    }

    async listSubscriptions(customerEmail: string) {
        try {
            const response = await this.paystack.subscription.list({ customer: customerEmail });
            return response.data;
        } catch (error) {
            console.error('Paystack API Error:', error.response ? error.response.data : error.message);
            throw new Error(`Error listing subscriptions: ${error.message}`);
        }
    }

    async enableSubscription(code: string, token: string) {
        try {
            const response = await this.paystack.subscription.enable({
                code,
                token
            });
            return response.data;
        } catch (error) {
            console.error('Paystack API Error:', error.response ? error.response.data : error.message);
            throw new Error(`Error enabling subscription: ${error.message}`);
        }
    }

    async createDedicatedVirtualAccount(customer: any) {
        try {
            const response = await this.paystack.nuban.create({
                customer: customer,
                preffered_bank: 'wema-bank',
            })
            console.log(response.data)
            return response.data
        } catch (error) {
            throw new Error(`Error creating dedicated virtual account: ${error.message}`)
        }
    }

    async getVirtualAccount(id: string) {
        try {
            const response = await this.paystack.nuban.get(id)
            return response.data
        } catch (error) {
            throw new Error(`Error fetching dedicated virtual account: ${error.message}`)
        }
    }

    async deleteVirtualAccount(id: string) {
        try {
            const response = await this.paystack.nuban.deactivate(id)
            return response.data
        } catch (error) {
            throw new Error(`Error Deactivating dedicated virtual account: ${error.message}`)
        }
    }

    async verifyTransaction(reference: string) {
        try {
            const response = await this.paystack.transaction.verify(reference)
            return response.data
        } catch (error) {
            throw new Error(`Error verifying transaction: ${error.message}`)
        }
    }

    // create recipient

    async createRecipient(name: string, accountNumber: string, bankCode: string) {
        try {
            const response = await this.paystack.transfer_recipient.create({
                type: 'nuban',
                name,
                account_number: accountNumber,
                bank_code: bankCode,
                currency: 'NGN',
            })
            return response.data
        } catch (error) {
            throw new Error(`Error creating recipient: ${error.message}`)
        }
    }



    async customerWithdrawal(amount: any, recipientCode: any, reference: any) {
        try {
            const response = await this.paystack. transfer.create({
                source: 'balance',
                amount,
                recipient: recipientCode,
                reason: 'Customer withdrawal',
                reference,
            })
            return response.data
        } catch (error) {
            throw new Error(`Error processing customer withdrawal: ${error.message}`)
        }
    }

    async addDeposit(customerEmail: any, amount: any, reference: any) {
        try {
            const response = await this.paystack.transaction.initialize({
                email: customerEmail,
                amount,
                reference,
            })
            return response.data
        } catch (error) {
            throw new Error(`Error adding deposit: ${error.message}`)
        }
    }



    async scheduleWithdrawal(amount: any, recipientCode: any, reference: any) {
        try {
            const response = await this.paystack.transfer.create({
                source: 'balance',
                amount,
                recipient: recipientCode,
                reason: 'Savings withdrawal',
                reference,
            })
            return response.data
        } catch (error) {
            throw new Error(`Error scheduling withdrawal: ${error.message}`)
        }
    }

    async refundTransaction(transactionId: string, amount: any) {
        try {
            const response = await this.paystack.refund.create({
               transaction: transactionId,
                amount: amount
            })
            console.log(response)
            return response;
        } catch (error) {
            console.error('Paystack API Error (refundTransaction):', error.response ? error.response.data : error.message);
            throw new Error('Failed to refund transaction: ' + (error.response ? error.response.data.message : error.message));
        }
    }

    async tokenizeCard(email: string, cardDetails: any) {
        try {
            const card = {
                number: cardDetails.card_number,
                cvv: cardDetails.cvv,
                expiry_month: cardDetails.expiry_month,
                expiry_year: cardDetails.expiry_year
            }
            const response = await this.paystack.charge.tokenize({
                email: email, 
                card
            })

            return response
        } catch (error) {
            console.error('Paystack API Error (chargeCard):', error.response ? error.response.data : error.message);
            throw new Error('Failed to charge card: ' + (error.response ? error.response.data.message : error.message));
        }
    }




    async chargeCard (email: string, amount: any, authorization_code: string) {
        try {
           

            const response = await this.paystack.charge.charge({
                email: email, 
                amount,
                authorization_code
            })

            return response

        } catch (error) {
            console.error('Paystack API Error:', error.response ? error.response.data : error.message);
        }
    }


    async createPlan(name: any, description: any, amount: any, interval: any) {
        try {
            const response = await this.paystack.plan.create({
                name,
                description,
                amount,
                interval,

            })
            return response.data
        } catch (error) {
            throw new Error(`Error creating plan: ${error.message}`)
        }
    }

    // Refund method removed as there is no Paystack refund service available

    async fetchTransactions(data: any) {
        try {
            const response = await this.paystack.transaction.list(data)
            return response.data
        } catch (error) {
            throw new Error(`Error fetching user card transactions: ${error.message}`)
        }
    }
}

export default PaystackService