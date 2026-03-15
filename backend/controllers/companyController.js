const Company = require('../models/Company');
const User = require('../models/User');
const Order = require('../models/Order');

// GET /api/companies
const getCompanies = async (req, res) => {
    try {
        const { search } = req.query;
        let filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const companies = await Company.find(filter).populate('owner', 'name email phone').sort('-createdAt');
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch companies', error: error.message });
    }
};

// GET /api/companies/:id
const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id).populate('owner', 'name email phone');
        if (!company) return res.status(404).json({ message: 'Company not found' });

        const orders = await Order.find({ company: company._id }).sort('-createdAt').limit(10);
        res.json({ company, recentOrders: orders });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch company', error: error.message });
    }
};

// PUT /api/companies/:id
const updateCompany = async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update company', error: error.message });
    }
};

// PUT /api/companies/:id/toggle
const toggleCompanyStatus = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });
        company.isActive = !company.isActive;
        await company.save();

        if (company.owner) {
            await User.findByIdAndUpdate(company.owner, { isActive: company.isActive });
        }

        res.json(company);
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle status', error: error.message });
    }
};

module.exports = { getCompanies, getCompanyById, updateCompany, toggleCompanyStatus };
