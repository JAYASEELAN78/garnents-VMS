const express = require('express');
const router = express.Router();
const { getCompanies, getCompanyById, updateCompany, toggleCompanyStatus } = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

router.get('/', protect, roleMiddleware('admin'), getCompanies);
router.get('/:id', protect, roleMiddleware('admin'), getCompanyById);
router.put('/:id', protect, roleMiddleware('admin'), updateCompany);
router.put('/:id/toggle', protect, roleMiddleware('admin'), toggleCompanyStatus);

module.exports = router;
