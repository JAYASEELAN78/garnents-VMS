const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, getInvoiceById, downloadInvoicePDF, updateInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

router.post('/', protect, roleMiddleware('admin'), createInvoice);
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.get('/:id/pdf', protect, downloadInvoicePDF);
router.put('/:id', protect, roleMiddleware('admin'), updateInvoice);

module.exports = router;
