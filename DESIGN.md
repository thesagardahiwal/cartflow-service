# CartFlow Architecture Design

## Core Architecture

CartFlow follows a strict **Layered Controller-Service-Repository Architecture**. This provides high cohesion and loose coupling.

### Execution Flow
1. **Router Layer**: Captures requests, enforces authentication, and applies Zod validation.
2. **Controller Layer**: Handles Express HTTP request/response mappings. **No business logic or DB calls exist here.**
3. **Service Layer**: Pure business logic (e.g., CartService, CheckoutService).
4. **Repository Layer**: Abstraction over Mongoose ODM for database operations.

## Advanced Production Patterns & Optimizations

### 1. Optimistic Concurrency Control (OCC)
To prevent race conditions when multiple clients simultaneously update the same cart, OCC is implemented natively using document versioning. 
- The `Cart` schema tracks a `version` integer.
- The `cartRepository.updateCartWithOCC()` method requires the `expectedVersion` and atomically increments it via MongoDB's `$inc` operator.
- If a version mismatch occurs, the Service layer traps it and returns a `409 Conflict`.

### 2. Index Strategy & Query Optimization
All collections have been highly optimized to reduce full collection scans:
- **Cart**: Compound index `{ userId: 1, status: 1 }` enables hyper-fast active cart fetching.
- **AuditLog**: `{ userId: 1, createdAt: -1 }` allows scalable log retrieval.
- **OutboxEvent**: `{ processed: 1, createdAt: 1 }` accelerates background sweeping.
- **Analytics**: `{ 'topProducts.productId': 1 }` and `{ 'mostUsedCampaigns.campaignId': 1 }`.
Additionally, heavy read operations across all repositories heavily utilize `.lean()` queries to drastically reduce Node.js memory overhead by bypassing Mongoose document instantiation.

### 3. Redis Caching Strategies
Redis acts as a high-speed volatile storage layer.
- **Cart Caching**: Lookups for `getActiveCart` hit `cacheService` first. Cache is invalidated synchronously upon any cart mutation.
- **Promotion Caching**: The `campaignRepository` aggressively caches active promotional campaigns with a 300-second TTL to offload database load during high-traffic checkout storms.

### 4. Advanced Analytics Aggregation Design
Instead of running heavy map-reduce operations in application memory, the nightly `analyticsAggregation` cron job pushes calculations into the database engine:
- It leverages MongoDB Aggregation Pipelines (`$match`, `$group`, `$sort`) on the `AuditLog` collection.
- It then commits the massive data aggregation efficiently via a single `Analytics.collection.bulkWrite()` upsert.

### 5. End-to-End Request Tracing
Winston outputs logs in strict JSON format. 
- We utilize `AsyncLocalStorage` to store unique `requestId`s extracted from headers (or generated via `crypto.randomUUID()`). 
- The `EventBus` has been augmented to seamlessly inject this `requestId` directly into the payloads of asynchronous event emitters, ensuring downstream outbox workers and async listeners retain complete log traceability.

### 6. Metrics Collection
A dedicated `MetricsService` hooks into Redis pipelines to record high-throughput application metrics without blocking the Event Loop:
- Total Requests & Average Response Times
- Cache Hits/Misses
- Promotion Usage Count
- Active Checkouts
These are cleanly exposed via the highly scalable `GET /metrics` endpoint.

### 7. Dead Letter Queue (DLQ)
Enhancing the Outbox pattern for guaranteed delivery, we introduced a structured DLQ mechanism inside the `outboxWorker`.
- The Outbox tracks `retryCount` per event.
- If processing fails (e.g., downstream Kafka offline) 3 times sequentially, the worker uses `bulkWrite` to safely move the poison message to the `FailedEvent` DLQ collection.
- This ensures silent event loss never occurs while preventing bad payloads from permanently blocking the outbox sweep pipeline.

### 8. Health Checks & Dependency Monitoring
Kubernetes-ready probes:
- `GET /health`: Returns basic uptime and tracing ID.
- `GET /health/dependencies`: Verifies `mongoose.connection.readyState` and Redis `status`, dynamically degrading the return code to `503 Service Unavailable` if an external layer disconnects.

### 9. Performance Optimizations & Bulk Operations
Throughout background jobs (`outboxWorker` and `analyticsAggregation`), individual queries were entirely dropped in favor of `bulkWrite`, `insertMany`, and `deleteMany`. This inherently reduces DB context switching and latency roundtrips by orders of magnitude.

## Promotion Engine (Strategy Pattern)
The promotion engine is completely decoupled from the CheckoutService. It iterates over active campaigns and dynamically loads the correct execution strategy (`CartValueStrategy`, `CategoryStrategy`, `BulkStrategy`, `PremiumStrategy`). This adheres to the Open-Closed principle.

## Tradeoffs and Scalability Considerations

1. **Memory vs Consistency**: The 300s TTL on Promotional Campaigns prioritizes checkout speed over instant promotional toggling. If an administrator turns off a campaign, it may incorrectly apply for up to 5 minutes.
2. **Node.js Event Emitters vs Message Brokers**: The current `EventEmitter` is in-memory. If CartFlow scales horizontally across multiple pods, events emitted in Pod A won't trigger listeners in Pod B. The **Outbox Pattern** mitigates this for critical events, serving as the bridge to a real distributed message broker.
3. **Database Growth**: `CartHistory`, `AuditLog`, and `FailedEvent` will grow immensely in production. They require TTL indexes or archival pipelines to move cold data to a data lake.
