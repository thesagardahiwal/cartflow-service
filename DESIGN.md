# CartFlow Architecture Design

## Core Architecture

CartFlow follows a strict **Layered Controller-Service-Repository Architecture**. This provides high cohesion and loose coupling.

### Execution Flow
1. **Router Layer**: Captures requests, enforces authentication, and applies Zod validation.
2. **Controller Layer**: Handles Express HTTP request/response mappings. **No business logic or DB calls exist here.**
3. **Service Layer**: Pure business logic (e.g., CartService, CheckoutService).
4. **Repository Layer**: Abstraction over Mongoose ODM for database operations.

## Advanced Production Patterns

### 1. Event-Driven Architecture
Business operations (like adding a cart item or completing checkout) emit domain events via a central Node.js `EventEmitter` (`EventBus`). This completely decouples core services from side effects like notifications, caching, and audit logging.

### 2. Audit Logging Flow
The `AuditLog` collection records granular actions (`CART_ITEM_ADDED`, `CART_CHECKOUT`, etc.). Instead of polluting the `CartService` with audit writes, an `audit.listener.ts` reacts to EventBus emissions and writes to the repository asynchronously.

### 3. Cart Versioning
To enable future rollback support and debugging, `CartHistory` is implemented. Every time a cart is mutated and saved, the `CartService` creates an incremental snapshot of the cart's entire state.

### 4. Idempotency Implementation
`idempotency.middleware.ts` intercepts requests with the `Idempotency-Key` header.
- It computes a hash of the request payload to ensure the payload hasn't changed.
- If it detects a duplicate request, it immediately returns the cached `statusCode` and `response` payload from `IdempotencyRecord` in MongoDB, preventing duplicate database writes or double checkouts.

### 5. Redis Caching Strategy
Integrated `ioredis` for fast reads. When fetching a cart for a read-heavy operation (`GET /cart`), it hits Redis first. If it's a cache miss, it falls back to MongoDB and caches the result. The cache is automatically invalidated when the cart mutates (`ITEM_ADDED`, `ITEM_UPDATED`, `ITEM_REMOVED`).

### 6. Outbox Pattern
Critical events (like `CHECKOUT_COMPLETED` and `CART_EXPIRED`) are guaranteed to be processed via the Outbox Pattern. When a checkout finishes, an `OutboxEvent` is saved in the same logical boundary. A background cron job (`outboxWorker.ts`) continually sweeps unprocessed events, simulating reliable delivery to message brokers (like Kafka or RabbitMQ) in a microservice environment.

### 7. Analytics Architecture
- **Real-time Metrics**: Tracked in Redis via the `analytics.listener.ts` (e.g., hash maps for promotion usage).
- **Nightly Aggregation**: A cron job runs nightly to map-reduce and aggregate the massive `AuditLog` table into simple, precomputed `Analytics` snapshot documents. This prevents expensive runtime queries when accessing the Analytics Dashboard.

### 8. Request Context Correlators & Structured Logging
Winston outputs logs in strict JSON format. We utilize `AsyncLocalStorage` to store unique `requestId`s per request. Winston automatically hooks into this storage to append the `requestId` to every single log entry natively, drastically improving log traceability across asynchronous operations.

## Promotion Engine (Strategy Pattern)
The promotion engine is completely decoupled from the CheckoutService. It iterates over active campaigns and dynamically loads the correct execution strategy (`CartValueStrategy`, `CategoryStrategy`, `BulkStrategy`, `PremiumStrategy`). This adheres to the Open-Closed principle, allowing new promotion types to be added by simply extending the Strategy interface.

## Tradeoffs and Scalability Considerations
- **Node.js Event Emitters vs Message Brokers**: The current `EventEmitter` is in-memory. If CartFlow scales horizontally across multiple pods, events emitted in Pod A won't trigger listeners in Pod B. The **Outbox Pattern** mitigates this for critical events, serving as the bridge to a real distributed message broker.
- **Redis TTLs**: Cart caches should have TTLs to prevent memory bloating for inactive users.
- **Database Growth**: `CartHistory`, `AuditLog`, and `OutboxEvent` will grow immensely in production. They require TTL indexes or archival pipelines to move cold data to a data lake.
