import express from 'express';
import Bill from '../models/Bill.js';
import { isEmailConfigured, sendBillNotification, sendNotification, sendReportEmail, calculateAndSendDailySummary } from '../services/emailService.js';

const router = express.Router();

// Check email configuration status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        configured: isEmailConfigured(),
        emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.slice(0, 3)}***` : null
    });
});

// Send test email
router.post('/test', async (req, res) => {
    try {
        const { to } = req.body;
        const recipient = to || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

        if (!recipient) {
            return res.status(400).json({ success: false, message: 'No recipient email provided' });
        }

        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured. Set RESEND_API_KEY in .env'
            });
        }

        const result = await sendNotification(
            recipient,
            '✅ Test Email - V.M.S GARMENTS',
            'This is a test email to verify your email configuration is working correctly. If you received this, your SMTP settings are properly configured!'
        );

        res.json({
            success: result.success,
            message: result.success ? `Test email sent to ${recipient}` : result.message
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send daily summary email to admin
router.post('/daily-summary', async (req, res) => {
    try {
        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured'
            });
        }

        const recipient = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (!recipient) {
            return res.status(400).json({ success: false, message: 'No admin email configured' });
        }

        const adminEmails = recipient.split(',').map(e => e.trim());
        const result = await calculateAndSendDailySummary(adminEmails);

        res.json({
            success: result.success,
            message: result.success ? `Daily summary sent to admin` : result.message,
            data: result.data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send report email
router.post('/send-report', async (req, res) => {
    try {
        const { type, fromDate, toDate, data, to } = req.body;

        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured'
            });
        }

        const recipient = to || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (!recipient) {
            return res.status(400).json({ success: false, message: 'No recipient email configured' });
        }

        const reportTitles = {
            sales: 'Sales Report',
            purchase: 'Purchase Report',
            stock: 'Stock Report',
            'auditor-sales': 'Auditor Sales Report',
            'auditor-purchase': 'Auditor Purchase Report'
        };
        const title = reportTitles[type] || 'Report';
        const options = { title, fromDate, toDate, type };

        const adminEmails = recipient.split(',').map(e => e.trim());
        const results = await sendReportEmail(data, options, adminEmails);
        const sent = results.some(r => r.success);

        res.json({
            success: sent,
            message: sent ? `${title} sent to ${recipient}` : 'Failed to send email report'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send bill email to customer
router.post('/send-bill/:billId', async (req, res) => {
    try {
        const { billId } = req.params;
        const { to } = req.body; // Optional override email

        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Email service not configured. Set RESEND_API_KEY in .env'
            });
        }

        // Determine recipient: explicit `to`, customer email, or admin email
        const recipient = to || bill.customer?.email;
        if (!recipient) {
            return res.status(400).json({
                success: false,
                message: 'No email address found. Please provide a recipient email.'
            });
        }

        const results = await sendBillNotification(bill, [recipient]);
        const sent = results.some(r => r.success);

        res.json({
            success: sent,
            message: sent ? `Bill ${bill.billNumber} emailed to ${recipient}` : 'Failed to send email'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
