# Bank Transaction System

A backend REST API for managing users, bank accounts, balances, and ledger-backed money transfers. The application is built with Node.js, Express, and MongoDB using Mongoose.

> **Project status:** This project is currently an API/backend implementation. The repository does not yet include a test suite or a production deployment configuration.

## Features

- User registration, login, and logout
- Password hashing with `bcryptjs`
- JWT authentication using cookies or Bearer tokens
- Token blacklisting on logout
- User account creation and account lookup
- Account balance calculation from immutable credit/debit ledger entries
- Account statuses: `active`, `frozen`, and `closed`
- Transactions between accounts
- Idempotency-key support to prevent duplicate transactions
- MongoDB sessions for atomic transaction and ledger updates
- System-user endpoint for adding initial funds
- Registration and transaction email notifications through Nodemailer/Gmail OAuth2

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JSON Web Tokens (`jsonwebtoken`)
- **Password security:** `bcryptjs`
- **Email:** Nodemailer with Gmail OAuth2
- **Configuration:** `dotenv`

## Project Structure

```text
.
├── server.js                 # Loads configuration, connects to MongoDB, starts the server
├── package.json
└── src/
    ├── app.js                # Express application and route registration
    ├── config/
    │   └── db.js             # MongoDB connection
    ├── controllers/          # Request handlers for auth, accounts, and transactions
    ├── middleware/
    │   └── auth.middleware.js
    ├── models/               # Mongoose schemas for users, accounts, transactions, and ledger entries
    ├── routes/               # API route definitions
    └── services/
        └── email.service.js  # Registration and transaction email notifications
```

## Prerequisites

- Node.js 18 or later
- npm
- A MongoDB database
- A MongoDB deployment that supports transactions (a replica set or MongoDB Atlas)
- Gmail OAuth2 credentials if email notifications are enabled

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/arnab-024/Bank-Transaction-System.git
   cd Bank-Transaction-System
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   MONGO_URL=mongodb://127.0.0.1:27017/bank_transaction_system
   JWT_SECRET=replace_with_a_long_random_secret

   # Gmail OAuth2 settings used by the email service
   EMAIL_USER=your-email@example.com
   CLIENT_ID=your-google-oauth-client-id
   CLIENT_SECRET=your-google-oauth-client-secret
   REFRESH_TOKEN=your-google-oauth-refresh-token
   ```

   Do not commit `.env` or any credentials to source control.

4. Start the server:

   ```bash
   node server.js
   ```

   The API listens on `http://localhost:3000`.

> The current `package.json` does not define a `start` script. You can add one such as `"start": "node server.js"` if you want to run the application with `npm start`.

## API Endpoints

All paths below are relative to `http://localhost:3000`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a user with `name`, `email`, and `password` |
| `POST` | `/api/auth/login` | Public | Log in with `email` and `password` |
| `POST` | `/api/auth/logout` | Authenticated | Clear the token and blacklist it |

Example registration body:

```json
{
  "name": "Asha Kumar",
  "email": "asha@example.com",
  "password": "strong-password"
}
```

### Accounts

These endpoints require authentication through the `token` cookie or an HTTP header such as `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/accounts` | Create an account for the authenticated user |
| `GET` | `/api/accounts` | Get the authenticated user's accounts |
| `GET` | `/api/accounts/balance/:accountId` | Get an account balance calculated from the ledger |

### Transactions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/transactions` | Authenticated | Transfer funds between two active accounts |
| `POST` | `/api/transactions/system/initial-funds` | System user | Add initial funds to an account |

Example transfer body:

```json
{
  "fromAccount": "SOURCE_ACCOUNT_ID",
  "toAccount": "DESTINATION_ACCOUNT_ID",
  "amount": 500,
  "idempotencyKey": "unique-request-key-001"
}
```

The `idempotencyKey` must be unique for each intended transfer. Reusing a key allows the API to identify an already pending, completed, failed, or reversed transaction.

## Data Model Overview

- **User:** Stores identity information, a hashed password, and an optional immutable system-user flag.
- **Account:** Belongs to a user and has a currency and status. The default currency is `INR`.
- **Transaction:** Records source and destination accounts, amount, status, and a unique idempotency key.
- **Ledger:** Stores immutable credit and debit entries. Account balances are derived from ledger totals rather than stored directly.
- **Blacklist:** Stores logged-out JWTs so they cannot be reused.

## Transaction Flow

A regular transfer follows an atomic ledger-based flow:

1. Validate the request and idempotency key.
2. Confirm both accounts exist and are active.
3. Calculate the sender's balance from ledger entries.
4. Create a pending transaction.
5. Create a debit entry for the sender.
6. Create a credit entry for the receiver.
7. Mark the transaction as completed.
8. Commit the MongoDB session.
9. Send a transaction notification email.

## Development Notes

- The server connects to MongoDB before starting to listen on port `3000`.
- Transactions use MongoDB sessions, so standalone MongoDB deployments that do not support transactions may fail during transfers.
- The application currently has no automated tests configured; `npm test` exits with a placeholder error.
- The log message in `server.js` says `https://localhost:3000`, but the server currently uses plain HTTP unless TLS is configured separately.
- Email delivery is optional for local development, but the current email service expects the OAuth2 environment variables to be configured.

## License

This project currently uses the ISC license as declared in `package.json`.
