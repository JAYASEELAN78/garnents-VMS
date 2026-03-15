export const getStatusColor = (status) => {
    const colors = {
        'Pending': 'bg-blue-100 text-blue-700 border-blue-200',
        'Payment Acceptance': 'bg-orange-100 text-orange-700 border-orange-200',
        'Material Received': 'bg-purple-100 text-purple-700 border-purple-200',
        'Processing': 'bg-amber-100 text-amber-700 border-amber-200',
        'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Delivered': 'bg-green-100 text-green-700 border-green-200',
        'Cancelled': 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export const ORDER_STATUSES = [
    'Pending', 'Payment Acceptance', 'Material Received', 'Processing', 'Completed', 'Delivered'
]

export const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    })
}

export const formatDateTime = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

export const getPriorityColor = (priority) => {
    const colors = {
        low: 'text-green-600', medium: 'text-yellow-600',
        high: 'text-orange-600', urgent: 'text-red-600'
    }
    return colors[priority] || 'text-gray-500'
}
