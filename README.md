# Event Ingestion & Analytics Backend

A backend service for ingesting structured event data and running time-window analytics queries.

The system exposes APIs to record events and retrieve aggregated insights such as event counts and user activity. It focuses on reliable event ingestion, correct handling of retries, and efficient querying of time-based data.

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
MySQL (Event table + indexes)
```

Events are validated at the API layer, stored in MySQL, and later queried through analytics endpoints.

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

---

## Event Count by Type

```
GET /api/v1/analytics/event-count
```

Returns counts of events grouped by type within a time window.

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

The system stores events as append-only records.

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

# Design Notes

**Idempotent ingestion**

Event writes are protected by a unique constraint on `idempotency_key`.
If a retry occurs, the existing event is returned instead of inserting a duplicate.

**occurred_at vs received_at**

Two timestamps are stored:

* `occurred_at` – when the event happened
* `received_at` – when the system received it

This allows correct handling of delayed or out-of-order events.

**Time-window querying**

Analytics queries use:

```
occurred_at >= start AND occurred_at < end
```

instead of `BETWEEN` to avoid boundary duplication across adjacent windows.

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