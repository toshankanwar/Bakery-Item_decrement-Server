// routes/confirmOrder.js
import express from 'express';
import { db, admin } from '../firebaseAdmin.js';

const router = express.Router();

router.post('/confirm-order', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { orderDocId, paymentStatus, orderItems } = req.body;

    // --- Input Validation ---
    if (!orderDocId) {
      console.error('Validation error: Missing orderDocId');
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Missing orderDocId',
      });
    }
    if (!paymentStatus || typeof paymentStatus !== 'string') {
      console.error('Validation error: Invalid paymentStatus');
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Invalid paymentStatus',
      });
    }
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      console.error('Validation error: No orderItems or empty array');
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'No orderItems.',
      });
    }

    for (const [index, item] of orderItems.entries()) {
      if (!item?.id || item.id.trim() === '') {
        console.error(`Validation error: Invalid itemId at index ${index}:`, item);
        return res.status(400).json({
          success: false,
          status: 'error',
          message: `Invalid itemId [${index}]`,
        });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.error(`Validation error: Invalid quantity at index ${index}:`, item.quantity);
        return res.status(400).json({
          success: false,
          status: 'error',
          message: `Invalid quantity for item [${index}]`,
        });
      }
    }

    console.log('Input validation passed.');

    // --- Firestore Transaction ---
    const result = await db.runTransaction(async (transaction) => {
      console.log('Starting Firestore transaction...');

      const orderRef = db.collection('orders').doc(orderDocId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        console.error(`Order not found: ${orderDocId}`);
        throw new Error('Order not found');
      }
      console.log(`Order document fetched: ${orderDocId}`);

      const itemDocs = [];
      for (const item of orderItems) {
        const itemRef = db.collection('bakeryItems').doc(item.id);
        const itemSnap = await transaction.get(itemRef);
        if (!itemSnap.exists) {
          console.error(`Bakery item not found: ${item.id}`);
          throw new Error(`Bakery item ${item.id} not found`);
        }
        itemDocs.push({ ref: itemRef, snap: itemSnap, qtyToDecrement: item.quantity });
        console.log(`Bakery item fetched: ${item.id}, current quantity: ${itemSnap.data().quantity}`);
      }

      // Check stock before writes
      for (const { snap, qtyToDecrement } of itemDocs) {
        const currentQty = Number(snap.data().quantity) ?? 0;
        console.log(`Checking stock for item ${snap.id}: currentQty=${currentQty}, requestedQty=${qtyToDecrement}`);
        if (currentQty < qtyToDecrement) {
          console.warn(`Insufficient stock for bakery item ${snap.id}: current ${currentQty}, requested ${qtyToDecrement}`);
          // Return object to inform frontend insufficient stock
          return { success: false, insufficientItemId: snap.id };
        }
      }

      // Update order & decrement stock
      console.log(`All items have sufficient stock. Updating order ${orderDocId} and decrementing stock...`);
      transaction.update(orderRef, {
        orderStatus: 'confirmed',
        paymentStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      for (const { ref, snap, qtyToDecrement } of itemDocs) {
        const currentQty = Number(snap.data().quantity) ?? 0;
        const newQty = currentQty - qtyToDecrement;
        console.log(`Decrementing item ${ref.id} quantity from ${currentQty} to ${newQty}`);
        transaction.update(ref, { quantity: newQty });
      }

      console.log('Transaction updates queued successfully.');

      // Return success flag
      return { success: true };
    });

    if (!result.success) {
      console.error(`Transaction failed due to insufficient stock of item: ${result.insufficientItemId}`);
      return res.status(400).json({
        success: false,
        status: 'payment_confirmed_order_cancelled',
        message: `Insufficient stock for item ${result.insufficientItemId}`,
        insufficientItemId: result.insufficientItemId,
      });
    }

    console.log('Order confirmed and stock decremented successfully.');
    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Order confirmed and stock decremented',
    });

  } catch (error) {
    console.error('Order/stock API error:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: error.message || String(error),
    });
  }
});

export default router;
