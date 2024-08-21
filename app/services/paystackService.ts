
// @ts-ignore
import Paystack from 'paystack-api';
import env from '#start/env'
import { DateTime } from 'luxon';

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

    async getSubscription(code: string){
        try {
            const {data} = await this.paystack.subscription.get(code)
            return data
        } catch (error) {
            throw new Error(`Error Getting subscription: ${error.message}`);
            
        }
    }

    async cancelSubscription (code: string, token: string){
        try {
            const { data } = await this.paystack.subscription.disable(code, token);
            return data;
        }
        catch (error) {
            throw new Error(`Error Cancelling subscription: ${error.message}`);
        }
    }

    async createDedicatedVirtualAccount(customer: any) {
        try {
            const response = await this.paystack.dedicated_virtual.create({
                customer: customer,
                preffered_bank: 'wema-bank',
            })
            return response.data
        } catch (error) {
            throw new Error(`Error creating dedicated virtual account: ${error.message}`)
        }
    }

    async getVirtualAccount(id: string){
        try {
        const response = await this.paystack.dedicated_virtual.get(id)
        return response.data 
        } catch (error) {
            throw new Error(`Error fetching dedicated virtual account: ${error.message}`)
        }
    }

    async deleteVirtualAccount(id: string){
        try {
        const response = await this.paystack.dedicated_virtual.deactivate(id)
        return response.data 
        } catch (error) {
            throw new Error(`Error Deactivating dedicated virtual account: ${error.message}`)
        }
    }

    async verifyTransaction(reference: string){
        try {
        const response = await this.paystack.transaction.verify(reference)
        return response.data 
        } catch (error) {
            throw new Error(`Error verifying transaction: ${error.message}`)
        }
    }

    async cardDeposit(customerEmail: any, amount: any, reference: any, plan: any) {
        try {
            const response = await this.paystack.transaction.initialize({
                email: customerEmail,
                amount,
                reference,
                plan 
            })
            return response.data
        } catch (error) {
            throw new Error(`Error processing card deposit: ${error.message}`)
        }
    }

    async customerWithdrawal(amount: any, recipientCode: any, reference: any) {
        try {
            const response = await this.paystack.transfer.create({
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

    async chargeCard (email: any,  card: any){
        try {
            const response = await this.paystack.charge.tokenize({
                email,
                card
            })
            return response
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

    async tokenizeCard(cardNumber: any, cvv: any, expiryMonth: any, expiryYear: any) {
        try {
            const response = await this.paystack.tokenization.tokenize({
                card: {
                    number: cardNumber,
                    cvv,
                    expiry_month: expiryMonth,
                    expiry_year: expiryYear,
                },
            })
            return response.data
        } catch (error) {
            throw new Error(`Error tokenizing card: ${error.message}`)
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

    async refund(data: any)
    {
        try {
            const response = await this.paystack.refund.create(data)
            return response.data
        } catch (error) {
            throw new Error(`Error refunding: ${error.message}`)
        }
    }

    async fetchTransactions(data: any)
    {
        try {
            const response = await this.paystack.transaction.list(data)
            return response.data
        } catch (error) {
            throw new Error(`Error fetching user card transactions: ${error.message}`)
        }
    }
}

export default PaystackService