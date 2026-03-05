# Event Ingestion & Analytics Backend

A backend service for ingesting structured event data and running time-window analytics queries.

The system exposes APIs to record events and retrieve aggregated insights such as event counts and user activity. It is designed for reliable ingestion, safe retry handling, and efficient analytics on time-based event data.

---

# Tech Stack

* **Node.js**
* **Express**
* **MySQL**
* **Prisma ORM**
* **Zod** for request validation

---

# Architecture

```
Client
  ↓
Express API
  ↓
Request Validation (Zod)
  ↓
Prisma ORM
  ↓
MySQL
  ├── Event (raw events)
  └── DailyEventCount (aggregated analytics)
```

Events are validated at the API layer, stored in MySQL, and queried through analytics endpoints. Aggregated data is maintained to support fast analytics queries.

---

# API Endpoints

## Event Ingestion

```
POST /api/v1/events
```

Records a single event.

Example request:

```json
{
  "event_type": "page_view",
  "user_id": "u123",
  "occurred_at": "2026-03-01T10:00:00Z",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "properties": {
    "page": "/home"
  }
}
```

Event ingestion is idempotent. Requests with the same `idempotency_key` will not create duplicate events.

---

## Batch Event Ingestion

```
POST /api/v1/events/batch
```

Accepts an array of events and processes them in a single request. The endpoint reports how many events were inserted, duplicated, conflicted, or failed.

Example response:

```json
{
  "inserted": 98,
  "duplicates": 1,
  "conflicts": 0,
  "failed": 1
}
```

---

## Event Count by Type

```
GET /api/v1/analytics/event-count
```

Returns counts of events grouped by type within a specified time window.

Query parameters:

```
start_time
end_time
```

Example response:

```json
[
  { "event_type": "page_view", "count": 120 },
  { "event_type": "purchase", "count": 8 }
]
```

---

## Event Count per User

```
GET /api/v1/analytics/user-event-count
```

Returns event counts grouped by user within a time window.

Example response:

```json
[
  { "user_id": "u1", "count": 42 },
  { "user_id": "u2", "count": 13 }
]
```

---

# Database Schema

## Event Table

Stores raw events as append-only records.

Fields:

* `id` – primary key
* `event_type`
* `user_id`
* `occurred_at`
* `received_at`
* `properties` (JSON)
* `idempotency_key` (unique)

Indexes:

```
(occurred_at, event_type)
(user_id, occurred_at)
```

These indexes support efficient time-range analytics queries.

---

## DailyEventCount Table

Stores aggregated daily event counts.

Fields:

* `date`
* `event_type`
* `count`

Composite key:

```
(date, event_type)
```

Analytics endpoints use this table to query aggregated event counts efficiently.

---

# Running the Project

Install dependencies:

```
npm install
```

Run the server:

```
node index.js
```

Apply database migrations:

```
npx prisma migrate dev
```

---

# Seeding Test Data

To generate test data for analytics queries:

```
node seed.js
```

The script inserts randomly generated events into the database.
