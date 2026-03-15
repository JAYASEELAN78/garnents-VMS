import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

// Initialize Razorpay with dummy keys if not provided in .env
// User will need to provide real keys for actual transactions
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Helper to create invoice and payment record after success
const createRecordsAfterPayment = async (orderId, razorpayPaymentId) => {
    try {
        const order = await Order.findById(orderId).populate('user_id');
        if (!order) return;

        // 1. Create Invoice if not exists
        const existingInvoice = await Invoice.findOne({ order_id: orderId });
        if (!existingInvoice) {
            const invoiceCount = await Invoice.countDocuments();
            const invoice_id = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

            const newInvoice = new Invoice({
                invoice_id,
                order_id: orderId,
                amount: order.estimatedCost || 0,
                tax: 0,
                total: order.estimatedCost || 0,
                date: new Date()
            });
            await newInvoice.save();
            console.log('Automatic invoice created for order:', order.order_id);
        }

        // 2. Create Payment record for history
        const userWithCompany = await User.findById(order.user_id).populate('company');
        const companyName = userWithCompany?.company?.name || 'Valued Client';

        const newPayment = new Payment({
            type: 'sales',
            companyName: companyName,
            date: new Date(),
            paymentType: 'upi', // Defaulting to UPI for portal payments
            amount: order.estimatedCost || 0,
            detail: `Online payment for Order ${order.order_id}. Ref: ${razorpayPaymentId || 'N/A'}`,
            isActive: true
        });
        await newPayment.save();
        console.log('Payment record created for:', companyName);

    } catch (err) {
        console.error('Auto-record creation error:', err);
    }
};

// Create Order
export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        console.log('Creating Razorpay order for:', { amount, orderId });

        // Check if we have real keys
        const isDummy = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_dummy_key';

        if (isDummy) {
            console.log('Using simulated mode for Razorpay');
            return res.status(200).json({
                success: true,
                simulated: true,
                order: {
                    id: `sim_order_${Math.random().toString(36).slice(2, 11)}`,
                    amount: Math.round(amount * 100),
                    currency: "INR"
                }
            });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${orderId}`,
        };

        const order = await razorpay.orders.create(options);
        console.log('Razorpay order created successfully:', order.id);

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verify Payment
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId // Our internal mongo order ID
        } = req.body;
        console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

        // Handle simulated payments
        if (razorpay_order_id && razorpay_order_id.startsWith('sim_order_')) {
            console.log('Verifying SIMULATED payment for:', orderId);
            await Order.findByIdAndUpdate(orderId, {
                payment_status: 'Paid',
            });

            // Generate Invoice and Payment records automatically
            await createRecordsAfterPayment(orderId, razorpay_payment_id);

            return res.status(200).json({ success: true, message: "Simulated payment verified" });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            console.log('Payment signature verified for:', orderId);
            // Update order status in database
            await Order.findByIdAndUpdate(orderId, {
                payment_status: 'Paid',
            });

            // Generate Invoice and Payment records automatically
            await createRecordsAfterPayment(orderId, razorpay_payment_id);

            return res.status(200).json({ success: true, message: "Payment verified successfully" });
        } else {
            console.error('Invalid payment signature!');
            return res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
