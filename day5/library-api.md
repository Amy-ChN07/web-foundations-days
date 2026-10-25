# Library Books API Design

This document outlines the REST API design for a library's **books** resource.

## Endpoints

### 1. List Books
* **Method:** `GET`
* **Path:** `/api/books`
* **Description:** Retrieves a list of all books in the library.
* **Success Status Code:** `200 OK`

### 2. Get One Book
* **Method:** `GET`
* **Path:** `/api/books/{id}`
* **Description:** Retrieves a single book by its unique ID.
* **Success Status Code:** `200 OK`

### 3. List Books by Author
* **Method:** `GET`
* **Path:** `/api/books?author={authorName}`
* **Description:** Retrieves a list of books written by a specific author using a query parameter.
* **Success Status Code:** `200 OK`

### 4. Create a Book
* **Method:** `POST`
* **Path:** `/api/books`
* **Description:** Adds a new book to the library catalog.
* **Example Request Body:**
  ```json
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "publishedYear": 1925
  }