import api from './api'

export const createOrder = (formData) => api.post('/api/orders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
export const getOrders = (params) => api.get('/api/orders', { params })
export const getOrderById = (id) => api.get(`/api/orders/${id}`)
export const getOrderStats = () => api.get('/api/orders/stats')
export const getInvoices = () => api.get('/api/invoices')
export const getInvoicePDF = (id) => api.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' })
export const deleteOrder = (id) => api.delete(`/api/orders/${id}`)
