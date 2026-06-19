# CartFlow - E-Commerce Cart Engine

A production-ready multi-tenant shopping cart engine microservice built with Node.js, Express.js, MongoDB, TypeScript, and Docker.

## Features
- **Multi-Tenant Cart Isolation**: Users can only access and modify their own carts securely via JWT.
- **Intelligent Item Ingestion**: Automatically updates quantities, removes items, and calculates subtotals.
- **Advanced Promotion Engine**: Strategy pattern implementation to run complex promotional campaigns (Value Discounts, Category Rewards, Bulk Purchases, Premium Bonus).
- **Checkout Service**: Calculates final totals by applying prioritized active campaigns.
- **Cart Expiration**: Background chron job sweeps expired carts (7 days inactivity).
- **Enterprise Ready**: Includes Rate Limiting, Zod Validation, Winston Structured Logging, Request Correlation IDs, and an Audit Trail.

## Architecture
See [DESIGN.md](./DESIGN.md) for detailed architecture diagrams and design decisions.

## Prerequisites
- Docker & Docker Compose
- Node.js 18+

## Running the Application (Docker)
1. Clone the repository
2. Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
3. Run using Docker Compose:
   ```bash
   docker-compose up --build
   ```
The API will be available at `http://localhost:3000`.

## Local Development
1. Install dependencies: `npm install`
2. Start MongoDB locally or provide a URI in `.env`
3. Run in dev mode: `npm run dev`
4. Build for production: `npm run build`

## API Documentation
- **Swagger UI**: Available at `http://localhost:3000/api-docs`
- **Postman Collection**: Import `postman_collection.json` into Postman.

## Testing
Run unit and integration tests using Jest:
```bash
npm run test
```
