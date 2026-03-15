const statusColorMap = {
    // Orders
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Payment Acceptance': 'bg-orange-100 text-orange-800',
    'Material Received': 'bg-blue-100 text-blue-800',
    'Processing': 'bg-indigo-100 text-indigo-800',
    'Completed': 'bg-green-100 text-green-800',
    'Delivered': 'bg-purple-100 text-purple-800',
    'Cancelled': 'bg-red-100 text-red-800',

    // Payment
    'Paid': 'bg-emerald-100 text-emerald-800',
    'Failed': 'bg-rose-100 text-rose-800',
    'Negotiating': 'bg-amber-100 text-amber-800 border border-amber-200',

    // General
    'Default': 'bg-gray-100 text-gray-800'
};

const StatusBadge = ({ status }) => {
    const colorClass = statusColorMap[status] || statusColorMap['Default'];

    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
