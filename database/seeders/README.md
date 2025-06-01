# SaveVest Database Seeders

This directory contains database seeders for the SaveVest application. Seeders are used to populate the database with initial data for development and testing purposes.

## Available Seeders

1. **role_seeder.ts** - Creates different user roles (admin, accountant, auditor, analyst, manager, user)
2. **saving_type_seeder.ts** - Creates different saving types (Ajo, Savings, Investment)
3. **user_seeder.ts** - Creates sample users with different roles
4. **plan_type_seeder.ts** - Creates different plan types with various interest rates
5. **plan_seeder.ts** - Creates sample savings and investment plans
6. **wallet_seeder.ts** - Creates wallets for users with initial balances
7. **wallet_transaction_seeder.ts** - Creates sample wallet transactions
8. **plan_transaction_seeder.ts** - Creates sample plan transactions
9. **plan_subscriber_seeder.ts** - Creates sample plan subscriptions
10. **user_bank_seeder.ts** - Creates sample bank accounts for users
11. **user_card_seeder.ts** - Creates sample payment cards for users
12. **main_seeder.ts** - A master seeder that runs all seeders in the correct order

## Running Seeders

You can run the seeders using the AdonisJS CLI:

```bash
# Run all seeders
node ace db:seed

# Run a specific seeder
node ace db:seed --files=./database/seeders/user_seeder.ts

# Run the main seeder (recommended for development)
node ace db:seed --files=./database/seeders/main_seeder.ts
```

## Seeder Order

When running seeders individually, it's important to maintain the correct order to avoid foreign key constraint errors:

1. role_seeder.ts
2. saving_type_seeder.ts
3. user_seeder.ts
4. plan_type_seeder.ts
5. plan_seeder.ts
6. wallet_seeder.ts
7. wallet_transaction_seeder.ts
8. plan_transaction_seeder.ts
9. plan_subscriber_seeder.ts
10. user_bank_seeder.ts
11. user_card_seeder.ts

The `main_seeder.ts` file handles this order automatically.

## Customizing Seeders

You can modify the seeders to create different data as needed for your development environment. Each seeder file contains a `run()` method where you can add, modify, or remove data.

## Production Warning

These seeders are intended for development and testing environments only. Do not run them in a production environment unless you specifically want to populate your production database with this sample data.