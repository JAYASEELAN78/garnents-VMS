import express from 'express';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';

const router = express.Router();

// Dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        // This month stats
        const thisMonthStats = await Bill.aggregate([
            { $match: { date: { $gte: thisMonth } } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$grandTotal' },
                    orders: { $sum: 1 }
                }
            }
        ]);

        // Last month stats for comparison
        const lastMonthStats = await Bill.aggregate([
            { $match: { date: { $gte: lastMonth, $lte: lastMonthEnd } } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$grandTotal' },
                    orders: { $sum: 1 }
                }
            }
        ]);

        const thisMonthData = thisMonthStats[0] || { revenue: 0, orders: 0 };
        const lastMonthData = lastMonthStats[0] || { revenue: 0, orders: 0 };

        // Calculate growth
        const revenueGrowth = lastMonthData.revenue > 0
            ? ((thisMonthData.revenue - lastMonthData.revenue) / lastMonthData.revenue * 100).toFixed(1)
            : 0;
        const ordersGrowth = lastMonthData.orders > 0
            ? ((thisMonthData.orders - lastMonthData.orders) / lastMonthData.orders * 100).toFixed(1)
            : 0;

        // Customer count (unique phone numbers)
        const customers = await Bill.distinct('customer.phone');

        res.json({
            success: true,
            data: {
                totalRevenue: thisMonthData.revenue,
                totalOrders: thisMonthData.orders,
                avgOrderValue: thisMonthData.orders > 0 ? thisMonthData.revenue / thisMonthData.orders : 0,
                totalCustomers: customers.length,
                revenueGrowth: parseFloat(revenueGrowth),
                ordersGrowth: parseFloat(ordersGrowth)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Recent bills
router.get('/recent-bills', async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const bills = await Bill.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('billNumber customer.name grandTotal date paymentStatus');

        res.json({ success: true, data: bills });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Revenue chart data
router.get('/revenue-chart', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(new Date().getFullYear(), 0, 1);
                break;
            case 'month':
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        const data = await Bill.aggregate([
            { $match: { date: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    revenue: { $sum: '$grandTotal' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Low stock alerts
router.get('/low-stock-alerts', async (req, res) => {
    try {
        const products = await Product.find({
            isActive: true,
            $expr: { $lte: ['$stock', '$lowStockThreshold'] }
        })
            .select('name stock lowStockThreshold')
            .limit(5);

        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
