import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { ShoppingCart, Search, Filter, Eye, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState('all');
    const filterRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/api/orders');
                setOrders(data);
            } catch (error) {
                console.error('Failed to load orders', error);
            } finally {
                // Set loading false only on initial render
                setLoading(false);
            }
        };
        fetchOrders();

        const intervalId = setInterval(fetchOrders, 10000);
        return () => clearInterval(intervalId);
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilterDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.delete(`/api/orders/${id}`);
            setOrders(prev => prev.filter(o => o._id !== id));
            toast.success('Order deleted.');
        } catch {
            toast.error('Failed to delete order.');
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.company_id?.name || o.user_id?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;

        return matchesSearch && matchesPayment;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-blue-600" /> Orders Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track and manage all job work orders.</p>
                </div>
            </div>

            <Card>
                <CardHeader
                    title="Recent Orders"
                    action={
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                                />
                            </div>
                            <div className="relative" ref={filterRef}>
                                <button
                                    className={`btn-secondary flex items-center gap-2 ${paymentFilter !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                >
                                    <Filter className="w-4 h-4" />
                                    {paymentFilter === 'all' ? 'Filter' : paymentFilter}
                                </button>

                                {showFilterDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-2 border-bottom border-gray-50 bg-gray-50/50">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Payment Status</span>
                                        </div>
                                        <div className="p-1">
                                            {['all', 'Paid', 'Pending'].map((status) => (
                                                <button
                                                    key={status}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group ${paymentFilter === status ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => {
                                                        setPaymentFilter(status);
                                                        setShowFilterDropdown(false);
                                                    }}
                                                >
                                                    <span className="capitalize">{status}</span>
                                                    {paymentFilter === status && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                />
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading orders...</div>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableHeader>Order ID</TableHeader>
                                <TableHeader>Client</TableHeader>
                                <TableHeader>Product</TableHeader>
                                <TableHeader>Date</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Payment Status</TableHeader>
                                <TableHeader>Action</TableHeader>
                            </TableHead>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan="7" className="text-center text-gray-500 py-8">
                                            No orders found.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.map((order) => (
                                    <TableRow key={order._id}>
                                        <TableCell>
                                            <span className="font-semibold text-gray-900">{order.order_id}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900">
                                                {order.company_id?.name || order.user_id?.name || 'Unknown Client'}
                                            </div>
                                            {order.user_id?.name && order.company_id?.name && (
                                                <div className="text-xs text-gray-500">{order.user_id.name}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-900">{order.product_name}</div>
                                            <div className="text-xs text-gray-500">{order.quantity} {order.unit || 'pcs'}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {new Date(order.order_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={order.status} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={order.payment_status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    title="View Details"
                                                    onClick={() => navigate(`/orders/${order._id}`)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Edit Order"
                                                    onClick={() => navigate(`/orders/${order._id}`)}
                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Delete Order"
                                                    onClick={() => handleDelete(order._id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default OrdersPage;
