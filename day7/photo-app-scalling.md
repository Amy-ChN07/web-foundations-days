# SnapShare: Scalability and Architecture Plan

## 1. Assumptions & Daily Active Users (DAU)
**Starting Facts Provided:**
* 10 million registered users.
* 10% active each day.
* Each active user uploads 1 photo per day.
* Each active user views 50 feed pages per day.
* Average photo size: 2 MB.
* Thumbnail size: 50 KB.

**Calculations:**
* **Daily Active Users (DAU):** 10,000,000 registered users * 10% = **1,000,000 DAU**.

## 2. Throughput & Storage Estimates
*Assume 86,400 seconds in a day.*

**Uploads per second:**
* Daily uploads: 1,000,000 photos (1 per active user).
* Average uploads/sec: 1,000,000 / 86,400 ≈ **11.5 photos/sec**.
* Peak uploads/sec (5x average): 11.5 * 5 = **57.5 photos/sec**.

**Feed views per second:**
* Daily views: 1,000,000 users * 50 views = 50,000,000 feed views.
* Average views/sec: 50,000,000 / 86,400 ≈ **578.7 views/sec**.
* Peak views/sec (5x average): 578.7 * 5 = **2,893.5 views/sec**.

**Photo Storage per year:**
* Daily storage: 1,000,000 photos * (2 MB original + 0.05 MB thumbnail) = 2.05 MB per photo.
* Total daily storage: 1,000,000 * 2.05 MB = 2,050,000 MB ≈ 2.05 TB per day.
* Total storage per year: 2.05 TB * 365 days = **748.25 TB (or ~0.75 Petabytes) per year**.

## 3. System Load: Read-Heavy vs. Write-Heavy
This system is heavily **Read-Heavy**. 
* **Why:** We estimate ~578 average feed views per second compared to only ~11.5 uploads per second. Users spend vastly more time consuming content than creating it.
* **Design Implications:** The architecture must prioritize fast read speeds. We need aggressive caching (like Redis) and read replicas to distribute the high volume of read requests without overloading the primary database.

## 4. Why Photos Should Not Be Stored in the Database
Storing 2MB photos directly inside a relational or NoSQL database is a massive anti-pattern. Databases are optimized for structured data and quick index lookups, not large binary blobs. Storing images in a DB causes severe performance degradation, bloats database backups, and makes scaling incredibly expensive. 
**Instead**, photos should be stored in **Object Storage** (like AWS S3 or Google Cloud Storage), which is specifically designed for cheap, highly available, and scalable file storage. The database should only store the metadata (URLs, user ID, timestamp).

## 5. Architecture Diagram (Text)

```text
[ Client (Mobile/Web) ]
          |
          v
   [ Load Balancer ]
          |
          v
    [ App Servers ] <-----> [ Cache (Redis) ] <-----> [ Read Replica DB ]
          |                                               ^
          |                                               |
          v                                               |
[ Queue (Kafka/RabbitMQ) ]                                    |
          |                                               |
          v                                               |
  [ Worker Nodes ] ---> [ Object Storage (S3) ] ---> [ Primary Database ]


  6. Component Explanations
CDN (Content Delivery Network): Caches and serves the heavy image files from edge locations close to the user, drastically reducing latency and bandwidth costs on the origin servers.

Load Balancer: Distributes incoming client traffic evenly across multiple app servers to prevent any single server from crashing under high load.

App Servers: Execute the core business logic, handle API requests, and orchestrate communication between the database, cache, and queue.

Cache (Redis): Stores frequently accessed data, such as pre-computed feed pages and user sessions, in memory to serve read requests at lightning speed.

Database with Read Replica: The primary database handles writes (new uploads), while read replicas handle the heavy volume of feed queries, ensuring the primary DB isn't overwhelmed.

Object Storage: Provides durable, infinitely scalable storage for the actual photo files and thumbnails, keeping the database lean.

Queue & Worker: The queue buffers photo processing tasks so the user doesn't have to wait, while the worker asynchronously generates thumbnails in the background.

 7. Step-by-Step Upload Flow
The client requests a secure upload URL from the App Server.

The client uploads the 2MB image directly to Object Storage (bypassing the app servers to save bandwidth).

Object Storage triggers an event (or the App Server does) to push a message to the Queue.

The App Server writes the photo metadata (URL, user ID) to the Primary Database.

A Worker node picks up the job from the Queue, downloads the original image, generates the 50KB thumbnail, and uploads it back to Object Storage.

The Worker updates the Database with the new thumbnail URL.

 8. Trade-offs
Eventual Consistency vs. Strong Consistency: We accept eventual consistency for the feed. When a user uploads a photo, it might take a few seconds to appear on their followers' feeds due to caching and queue delays. This trade-off is necessary to ensure the system remains highly available and fast under heavy read loads.
Direct-to-Cloud Uploads vs. Routing Through App Servers: By uploading images directly to Object Storage instead of the App Servers, we sacrifice a bit of immediate server-side validation (we have to validate via database rules later). However, this saves massive amounts of bandwidth and processing power on the app servers, allowing them to focus purely on API requests.