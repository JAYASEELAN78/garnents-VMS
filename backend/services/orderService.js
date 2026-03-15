const Order = require('../models/Order');

const getOrdersByCompany = async (companyId) => {
    return await Order.find({ company: companyId }).sort('-createdAt');
};

const getOrdersByStatus = async (status) => {
    return await Order.find({ status }).populate('company', 'name').sort('-createdAt');
};

module.exports = { getOrdersByCompany, getOrdersByStatus };
