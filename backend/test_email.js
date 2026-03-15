import mongoose from 'mongoose';
import { sendOrderStatusEmail } from './src/services/emailService.js';

async function test() {
  try {
    const order = { order_id: 'TEST1234', product_name: 'Test Shirt' };
    await sendOrderStatusEmail(order, 'Pending', 'Delivered', 'jayaseelans.24mca@kongu.edu');
    console.log("TEST FINISHED");
  } catch(e) {
    console.error(e);
  }
}
test();
