# Marketplace API

A RESTful API built with NestJS for managing marketplace operations.

## Technologies Used

- **Backend Framework**: NestJS (v11.0.1)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js
- **Development Tools**:
  - TypeScript
  - ESLint for code linting
  - Prettier for code formatting
  - Jest for testing

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v20 or higher)
- pnpm (recommended)
- PostgreSQL
- Git

## Project Structure

```
src/
├── products/        # Product management module
├── auth/           # Authentication module
├── users/          # User management module
└── main.ts         # Application entry point
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/fabiangzvo/marketplace-api.git
cd marketplace-api
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file and modify it according to your needs:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configurations:

| Variable Name     | Description                      | Default Value         | Required |
| ----------------- | -------------------------------- | --------------------- | -------- |
| `DB_HOST`         | PostgreSQL database host         | localhost             | Yes      |
| `DB_PORT`         | PostgreSQL database port         | 5432                  | Yes      |
| `DB_USERNAME`     | Database username                | postgres              | Yes      |
| `DB_PASSWORD`     | Database password                |                       | Yes      |
| `DB_DATABASE`     | Database name                    | marketplace           | Yes      |
| `JWT_SECRET`      | Secret key for JWT token signing |                       | Yes      |
| `PORT`            | Application port                 | 4000                  | Yes      |
| `ALLOWED_ORIGINS` | Allowed CORS origins             | http://localhost:3000 | Yes      |

### 5. Running the Application

#### Development Mode

```bash
pnpm start:dev
```

#### Production Mode

```bash
pnpm start:prod
```

### 6. Testing

Run unit tests:

```bash
pnpm test
```

### 7. Code Formatting and Linting

Format code:

```bash
pnpm format
```

Lint code:

```bash
pnpm lint
```
