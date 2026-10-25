# TicketHub System Design

## 1. Requirements

### Functional Requirements
*   **Browse Events:** Users can view a list of upcoming concerts and events.
*   **View Seats:** Users can view a seating map and the real-time availability of individual seats for a specific event.
*   **Hold Seats:** Users can temporarily reserve selected seats (e.g., for 10 minutes) while completing the checkout process.
*   **Payment:** Users can securely pay for their held seats.
*   **View Tickets:** Users can view their purchased tickets and order history.

### Non-Functional Requirements (NFRs)
*   **Speed (Low Latency):** Browsing and viewing seats must be extremely fast (< 200ms) to handle high traffic. The "big sale" must not crash the servers.
*   **Correctness (Data Integrity):** The system must absolutely prevent double-booking. One seat = one ticket.
*   **Fairness:** The system must handle the "big sale" fairly. We will implement a virtual waiting room (queue) so bots or users with faster internet don't instantly buy all the tickets at 10:00:00 AM.
*   **High Availability:** The system must remain online during massive traffic spikes.

## 2. Estimates (Traffic & Load)

*Given facts: 2M registered users; Normal day: 50k visitors, 10 pages each, 5k tickets sold. Big Sale: 200k users trying to buy 20k seats in 10 mins.*

### Normal Traffic Estimate
*   **Page Views:** 50,000 users * 10 pages = 500,000 page views/day.
*   **Average QPS (Queries Per Second):** 500,000 views / 86,400 seconds ≈ **5.8 QPS** (Assuming traffic is spread out, this is very low and easily handled by a single database/server).
*   **Writes (Ticket Sales):** 5,000 tickets / 86,400 seconds ≈ **0.05 Writes per second**.

### "Big Sale" Peak Estimate
*   **Concurrent Users:** 200,000 users hitting the site within the first 10 minutes.
*   **Peak QPS (Reads):** If all 200k users refresh the seat map at once, we could see 200,000 requests / 60 seconds ≈ **3,333 QPS** (Likely much higher due to refreshing).
*   **Peak Writes (Purchases):** 20,000 seats sold in 10 minutes (600 seconds) = **33.3 Writes per second**. (However, the database will receive hundreds of thousands of *attempted* holds).

**Comparison:** The big sale brings a **~500x increase in read traffic** and a massive spike in write contention. Normal architecture will fail; we need caching, queuing, and database locking.

## 3. API Design (RESTful)

*   **`GET /events`**: Browse events. (Returns: List of events, dates, venues).
*   **`GET /events/{event_id}/seats`**: View seats. (Returns: Seat map with status: `AVAILABLE`, `HELD`, `SOLD`).
*   **`POST /events/{event_id}/seats/hold`**: Hold seats. (Payload: `{ "seat_ids": [101, 102] }`. Returns: `hold_id`, expires_at). *Requires Auth.*
*   **`POST /checkout`**: Pay for tickets. (Payload: `{ "hold_id": "abc-123", "payment_token": "tok_visa" }`. Returns: `order_id`, `status: CONFIRMED`). *Requires Auth.*
*   **`GET /users/me/tickets`**: View your tickets. (Returns: List of confirmed orders and ticket QR codes). *Requires Auth.*

## 4. Data Model

*   **`Users` Table:**
    *   `id` (PK, UUID)
    *   `email` (String, Unique)
    *   `name` (String)
*   **`Events` Table:**
    *   `id` (PK, UUID)
    *   `name` (String)
    *   `event_date` (Timestamp)
    *   `venue_id` (FK to Venues)
*   **`Seats` Table:**
    *   `id` (PK, UUID)
    *   `event_id` (FK to Events)
    *   `seat_number` (String)
    *   `status` (Enum: `AVAILABLE`, `HELD`, `SOLD`)
    *   `version` (Integer - for optimistic locking)
    *   `held_until` (Timestamp, Nullable)
*   **`Orders` Table:**
    *   `id` (PK, UUID)
    *   `user_id` (FK to Users)
    *   `total_amount` (Decimal)
    *   `status` (Enum: `PENDING`, `PAID`, `CANCELLED`)
*   **`Order_Items` Table:**
    *   `order_id` (FK to Orders)
    *   `seat_id` (FK to Seats, Unique constraint to prevent double booking)

## 5. Preventing Double-Booking (Transactions & Constraints)

To prevent two people from buying the same seat, we use **Pessimistic Locking (Database Transactions)** combined with **Database Constraints**.

1.  When a user selects a seat, the backend starts a database transaction.
2.  It issues a query: `SELECT * FROM seats WHERE id = ? AND status = 'AVAILABLE' FOR UPDATE;` (The `FOR UPDATE` locks the row).
3.  If the seat is available, the backend updates the status to `HELD` and sets `held_until = NOW() + 10 mins`, then commits the transaction.
4.  If another user tries to select the same seat at the exact same millisecond, their transaction will wait for the first one to finish. Once the first finishes, the second user's query will return `status = 'HELD'`, and they will get a "Seat unavailable" error.
5.  **Final safeguard:** In the `Order_Items` table, `seat_id` has a `UNIQUE` constraint. Even if the application logic fails, the database will reject the insert of the second order for the same seat, throwing an error that we catch to show the user "Double booking prevented."

## 6. Architecture & Survivability

*Diagram Description (Text-based):*
`[Users] -> [CDN (Caches static assets)] -> [API Gateway / Load Balancer] -> [Node.js App Servers (Auto-scaled)] -> [Redis (Cache & Queue)] -> [PostgreSQL DB (Primary + Read Replicas)]`

**How it survives the Big Sale:**
*   **CDN & Redis:** Event details and seat maps (which are mostly read operations) are served from Redis and CDN, taking massive load off the database.
*   **API Gateway & Virtual Queue (Fairness):** We place a "Waiting Room" (using Redis) in front of the API. The 200,000 users are put into a queue. We only let a metered rate of users (e.g., 500 users per minute) into the actual purchasing flow. This prevents the servers from crashing.
*   **Optimistic Read Replicas:** Browsing events uses Read Replicas of our database, keeping the Primary DB free for crucial write operations (Holds and Payments).

## 7. Trade-offs

*   **Trade-off 1: Pessimistic Locking vs. User Experience.** Using database row locks (`FOR UPDATE`) guarantees correctness but can cause slight delays for users if a seat is highly contested. 
    *   *Alternative:* Optimistic locking (checking a version number before updating). It's faster but results in more transaction failures during high contention. We chose correctness over speed here.
*   **Trade-off 2: Virtual Waiting Room vs. Conversion Rate.** Implementing a queue provides fairness and protects our servers, but it frustrates users who have to wait. 
    *   *Alternative:* Let everyone in. This creates a terrible user experience (site crashes, 502 Bad Gateway errors) and lets bots steal all the tickets. We choose system stability and fairness over immediate gratification.