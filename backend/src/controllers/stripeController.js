import Stripe from 'stripe';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// Helper to create records after payment success
const createRecordsAfterPayment = async (orderId, sessionId) => {
    try {
        const order = await Order.findById(orderId).populate('user_id');
        if (!order) return;

        // 1. Create Invoice if not exists
        const existingInvoice = await Invoice.findOne({ order_id: orderId });
        if (!existingInvoice) {
            const invoiceCount = await Invoice.countDocuments();
            const invoice_id = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

            const totalAmount = order.finalCost || order.estimatedCost || 0;
            const subtotal = totalAmount / 1.05; // Reverse 5% tax
            const taxAmount = totalAmount - subtotal;

            const newInvoice = new Invoice({
                invoice_id,
                order_id: orderId,
                amount: Math.round(subtotal),
                tax: Math.round(taxAmount),
                total: Math.round(totalAmount),
                date: new Date()
            });
            await newInvoice.save();
            console.log('Automatic invoice created for order:', order.order_id);
        }

        // 2. Create Payment record for history
        const userWithCompany = await User.findById(order.user_id).populate('company');
        const companyName = userWithCompany?.company?.name || 'Valued Client';
        const totalPaid = order.finalCost || order.estimatedCost || 0;

        const newPayment = new Payment({
            type: 'sales',
            companyName: companyName,
            date: new Date(),
            paymentType: 'bank',
            amount: Math.round(totalPaid),
            detail: `Online Stripe payment for Order ${order.order_id}. Includes 5% GST. Session: ${sessionId}`,
            isActive: true
        });
        await newPayment.save();
        console.log('Stripe payment record created for:', companyName);

    } catch (err) {
        console.error('Auto-record creation error:', err);
    }
};

export const createCheckoutSession = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Initialize Stripe here to ensure the latest key is used if the process didn't restart
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey || stripeKey === 'sk_test_dummy') {
            console.error(`❌ STRIPE_SECRET_KEY is ${!stripeKey ? 'MISSING' : 'DUMMY'} in environment`);
            return res.status(500).json({
                success: false,
                message: 'Stripe is not configured correctly on the server. Please provide a real Secret Key.'
            });
        }

        const stripe = new Stripe(stripeKey);

        const baseAmount = order.finalCost || order.estimatedCost || order.price || 0;
        const cgst = baseAmount * 0.025;
        const sgst = baseAmount * 0.025;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'upi'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: (order.product_name || 'Product').replace(/sirt/i, 'shirt'),
                            description: `Base Price for Order ${order.order_id}`,
                        },
                        unit_amount: Math.round(baseAmount * 100),
                    },
                    quantity: 1,
                },
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'CGST (2.5%)',
                        },
                        unit_amount: Math.round(cgst * 100),
                    },
                    quantity: 1,
                },
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'SGST (2.5%)',
                        },
                        unit_amount: Math.round(sgst * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payments?success=true&orderId=${orderId}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payments?canceled=true`,
            metadata: {
                orderId: orderId.toString()
            }
        });

        console.log(`✅ Stripe session created for Order ${order.order_id}. Redirecting to: ${session.url}`);

        res.status(200).json({ success: true, url: session.url });
    } catch (error) {
        console.error('Stripe Session Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyStripePayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        // This is a simplified verification for when the user returns to the success page
        // In a production app, you should use Webhooks for reliability.
        const order = await Order.findById(orderId);
        if (order && order.payment_status !== 'Paid') {
            console.log(`🔍 Verifying payment for Order: ${order.order_id}`);
            await Order.findByIdAndUpdate(orderId, { payment_status: 'Paid' });
            await createRecordsAfterPayment(orderId, 'SESSION_COMPLETED');
            console.log(`✅ Order ${order.order_id} status updated to Paid`);
            return res.status(200).json({ success: true, message: 'Payment verified' });
        }

        res.status(200).json({ success: true, message: 'Already paid or no order' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
