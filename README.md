# 💰 SaveVest Engine - Modern Savings API Platform

## 🚀 Overview
SaveVest Engine is a robust, scalable savings API platform built with AdonisJS and TypeScript, designed to power modern financial applications. This engine provides a secure and efficient backbone for managing user savings, transactions, and financial operations.

## ⚡ Key Features

### 🔐 Advanced Security Implementation
- Robust authentication system with password hashing
- Two-Factor Authentication (2FA) support
- JWT-based secure API endpoints
- Rate limiting and request validation

### 📧 Automated Communication
- Elegant email templating system
- Welcome emails with personalized content
- Transaction notifications
- Security alert systems

### 🏗 Architecture Highlights
- Clean MVC architecture using AdonisJS
- Type-safe development with TypeScript
- Error boundary implementation for robust error handling
- Comprehensive API documentation
- RESTful API design patterns

### 💾 Data Management
- Structured database schema for financial transactions
- Efficient data validation using custom validators
- Secure password management system
- User profile management

## 🛠 Technical Stack
- **Framework**: AdonisJS
- **Language**: TypeScript
- **Authentication**: JWT + 2FA
- **Email Service**: Integrated email system
- **Security**: Built-in XSS protection, CSRF protection
- **Documentation**: OpenAPI/Swagger
- **Payment Gateway**: Paystack

## API Features

- User Authentication
- Two-Factor Authentication
- Savings Management
- Plans Management
- Wallet Operations
- Bank Integration
- Card Management
- Admin Operations

## Security

The API implements several security measures:
- Authentication Middleware
- Rate Limiting
- CORS Configuration
- Input Validation
- Role-based Access Control

## Cron Jobs

The system includes automated tasks for:
- Monthly Service Handling
- Weekly Service Handling
- Savings Interest Calculations
- Wallet Interest Processing

## 📦 Code Quality
```typescript
// Example of our clean controller implementation
async updatePassword({ auth, response, request }: HttpContext) {
    const { ...payload } = await request.validateUsing(updatePasswordValidator)
    try {
        const user = await auth.authenticate()
        const isSame = await hash.verify(user.password, payload.oldPassword)
        if (!isSame) {
            return response.status(400).send({ error: 'Incorrect old password' })
        }
        user.password = payload.newPassword
        await user.save()
        return response.status(200).send({ message: 'Password changed successfully' })
    } catch (error) {
        // Error handling
    }
}
```
## 🔥 Why SaveVest Engine?

- **Production-Ready**: Built with scalability and performance in mind
- **Developer-Friendly**: Well-documented codebase with TypeScript support
- **Secure by Design**: Implements industry-standard security practices
- **Modular Architecture**: Easy to extend and customize
- **Modern Stack**: Uses latest technologies and best practices

### - installation

```
git clone https://github.com/perfcreg/savevest-engine.git
cd savevest-engine
```

install dependencies
```
npm install
# or
yarn install
```

Configure Environment variables

```
cp .env.example .env
```

run migration
```
node ace migration:run
```

start the development server
```
node ace serve --watch
```

## 📝 Environment Variables

Make sure to set up the following environment variables in your .env file:

```
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
APP_KEY=your-app-key
DB_CONNECTION=pg
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=savevest
```

## 🧪 Running Tests
```
npm run test
# or
yarn test
```

## 🤝 Contributing
We welcome contributions! Please follow these steps:
- Fork the repository
- Create your feature branch ( git checkout -b feature/AmazingFeature)
- Commit your changes ( git commit -m 'Add some AmazingFeature')
- Push to the branch ( git push origin feature/AmazingFeature)
- Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 💖 Support The Project

If you find this project helpful and would like to support its development, you can contribute through various cryptocurrencies. Every contribution helps maintain and improve SaveVest Engine!

### 🪙 Cryptocurrency Donations

| Coin | Network | Address |
|------|---------|----------|
| ![BTC](https://img.shields.io/badge/Bitcoin-F7931A?style=flat&logo=bitcoin&logoColor=white) | Bitcoin | `14tJWtNbHVR3gNJcBRy3jNbwRDTYVem7xu` |
| ![ETH](https://img.shields.io/badge/Ethereum-3C3C3D?style=flat&logo=ethereum&logoColor=white) | Ethereum | `0xa74235a34bdb8a9e82e6cd518e86441d26d2230c` |
| ![USDT](https://img.shields.io/badge/Tether-50AF95?style=flat&logo=tether&logoColor=white) | TRC20 | `TTEmPwHMk9fSFeCX5xEG91LmnwQQrqb2g2` |
| ![BNB](https://img.shields.io/badge/BNB-F0B90B?style=flat&logo=binance&logoColor=white) | BSC | `0xa74235a34bdb8a9e82e6cd518e86441d26d2230c` |

### 📬 Contact
Oyewo Oluwafemi

Project Link: https://github.com/perfcreg/savevest-engine

Made with ❤️ for perfcreg Solution
