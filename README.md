# Bakery Item Decrement Server

Backend API server for securely confirming bakery orders by decrementing the inventory stock in Firestore.

Serves as a transactional endpoint to confirm orders, update payment and order status, and decrement bakery item quantities atomically — ensuring data consistency and preventing overselling.

---

## Features

- **Order Confirmation API**: Validates order data, checks stock availability for all items in an order.
- **Atomic Inventory Management**: Uses Firestore transactions to decrement bakery item quantities only if sufficient stock is available.
- **Order Status Update**: On successful validation and stock decrement, updates order status to `confirmed` with payment status.
- **Robust Validation**: Input data validation to prevent bad data from corrupting the database.
- **Detailed Logging**: Console logs for debugging and operational transparency.
- **Graceful Failure Handling**: Returns descriptive error messages when stock is insufficient or orders/items do not exist.
- **Express.js based REST API** with JSON payload.

---

## Getting Started

### Prerequisites

- Node.js (preferably v16+)
- Firebase project with Firestore database and proper permissions
- Firebase Admin SDK initialized and `db`/`admin` exported and properly configured
- Environment variables for Firestore Admin credentials (handled outside this module)
  
---

### Installation

1. Clone the repository:

```git clone https://github.com/toshankanwar/Bakery-Item_decrement-Server.git
cd Bakery-Item_decrement-Server ```


2. Install dependencies:

`` npm install ``


3. Configure environment variables and Firebase Admin credentials.

4. Start the server:

node server.js

Defaults to listening on `PORT` environment variable or 5000 if unset.

---

## API Documentation

### Confirm Order and Decrement Stock

`POST /confirm-order`

Accepts a JSON body with:

| Field         | Type     | Description                          | Required |
|---------------|----------|------------------------------------|----------|
| `orderDocId`  | `string` | Firestore document ID of the order | Yes      |
| `paymentStatus` | `string` | Payment status value (e.g., "confirmed") | Yes |
| `orderItems`  | `Array`  | Array of order items with `{ id: string, quantity: number }` | Yes |

---

#### Request Example

{
"orderDocId": "abc123",
"paymentStatus": "confirmed",
"orderItems": [
{ "id": "item001", "quantity": 2 },
{ "id": "item002", "quantity": 1 }
]
}

---

#### Response

- **Success (200 OK)**



{
"success": true,
"status": "success",
"message": "Order confirmed and stock decremented"
}

- **Failure due to insufficient stock (400 Bad Request)**
{
"success": false,
"status": "failure",
"message": "Insufficient stock for item item001",
"insufficientItemId": "item001"
}

- **Failure due to validation or server error (4xx/5xx)**
{
"success": false,
"status": "error",
"message": "Error details here..."
}

---

## How It Works

1. **Input Validation**  
   Requests missing required fields or with invalid types are rejected.

2. **Firestore Transaction**  
   The API fetches the order document and all related bakery item documents.  
   - Validates existence of order and items.  
   - Checks if all requested quantities are in stock.  
   - If stock is insufficient for any item, transaction aborts and a descriptive error is returned.  
   - Otherwise, the order status is updated to `confirmed` and payment status is recorded.  
   - Bakery item documents are updated to decrement stock quantities accordingly.  

3. **Response**  
   The API returns 200 OK with `{ success: true }` on success, or appropriate error messages otherwise.

---

## Logging and Debugging

Extensive `console.log` statements are present, outputting:

- Incoming request body  
- Validation steps and failures  
- Firestore reads and stock checks  
- Transaction success or failure

Ensure your environment captures logs (e.g., via PM2 or container logs) for operational monitoring.

---

## Environment Variables

- Ensure your Firebase Admin SDK is initialized properly in `firebaseAdmin.js`.  
- The server expects a valid Firebase Admin instance with Firestore access.  
- Optionally set `PORT` environment variable to specify the listening port (default 5000).

---

## Security Considerations

- Only allow this endpoint to be called from trusted clients or validate authentication tokens as needed.  
- Apply IP whitelisting or API key validation if exposing publicly.  
- Do not expose Firebase Admin credentials publicly.

---

## Example Setup for Firebase Admin Initialization (`firebaseAdmin.js`)


import admin from 'firebase-admin';
import serviceAccount from './path-to-serviceAccountKey.json' assert { type: "json" };

if (!admin.apps.length) {
admin.initializeApp({
credential: admin.credential.cert(serviceAccount),
});
}

const db = admin.firestore();

export { admin, db };


Use Postman or any HTTP client to POST to `/confirm-order` with proper JSON payload.

---

## License

This project is licensed under the MIT License.

---

## Contact

For questions or support, contact:

- **Email:** contact@toshankanwar.website  
- **GitHub:** https://github.com/toshankanwar/bakery-management-and-ecommerce

---

**Powered by Toshan Bakery Team**




