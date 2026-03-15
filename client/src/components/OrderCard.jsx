import { Link } from 'react-router-dom'
import { getStatusColor, formatDate, getPriorityColor } from '../utils/helpers'
import { HiOutlineClock, HiOutlineCube, HiOutlineEye, HiOutlineTrash, HiOutlineCurrencyRupee } from 'react-icons/hi'

const OrderCard = ({ order, onDelete }) => {
    return (
        <div className="glass-card p-5 hover:border-red-200 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">{order.order_id || order.orderId}</span>
                        <span className={`status-badge border ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-red-600 transition-colors">{order.product_name || order.productName}</h3>
                </div>
                <span className={`text-xs font-semibold uppercase ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <HiOutlineCube className="w-4 h-4 text-gray-400" />
                    <span>Qty: {order.quantity} {order.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <HiOutlineClock className="w-4 h-4 text-gray-400" />
                    <span>Delivery: {formatDate(order.delivery_date || order.deliveryDate)}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">Created {formatDate(order.createdAt)}</span>
                <div className="flex items-center gap-2">
                    <Link
                        to={`/orders/${order._id}`}
                        title="View Details"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        <HiOutlineEye className="w-4 h-4" /> View
                    </Link>
                    {order.status?.toUpperCase() === 'DELIVERED' && (
                        order.payment_status === 'Paid' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 border border-green-100 rounded-lg text-sm font-bold uppercase tracking-wide">
                                <HiOutlineCurrencyRupee className="w-4 h-4" /> Paid
                            </div>
                        ) : (
                            <Link
                                to="/payments"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-all shadow-sm shadow-green-200"
                            >
                                <HiOutlineCurrencyRupee className="w-4 h-4" /> Payments
                            </Link>
                        )
                    )}
                    {onDelete && (
                        <button
                            title="Cancel Order"
                            onClick={() => onDelete(order._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <HiOutlineTrash className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default OrderCard
