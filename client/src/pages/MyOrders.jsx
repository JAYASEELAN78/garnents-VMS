import { useState, useEffect } from 'react'
import { getOrders } from '../services/orderService'
import api from '../services/api'
import { ORDER_STATUSES } from '../utils/helpers'
import OrderCard from '../components/OrderCard'
import Loader from '../components/Loader'
import { HiOutlineSearch, HiOutlineFilter, HiOutlineClipboardList } from 'react-icons/hi'
import toast from 'react-hot-toast'

const MyOrders = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true)
            try {
                const { data } = await getOrders()
                // Backend returns a flat array, we filter and paginate locally
                let result = Array.isArray(data) ? data : (data.orders || [])

                if (statusFilter !== 'all') {
                    result = result.filter(o => o.status === statusFilter)
                }

                if (search) {
                    const lcSearch = search.toLowerCase()
                    result = result.filter(o =>
                        (o.order_id || o.orderId)?.toLowerCase().includes(lcSearch) ||
                        (o.product_name || o.productName)?.toLowerCase().includes(lcSearch)
                    )
                }

                setTotalPages(Math.ceil(result.length / 12) || 1)
                // Implement JS local pagination matching current page
                setOrders(result.slice((page - 1) * 12, page * 12))
            }
            catch (err) {
                console.error(err)
                setOrders([])
                setTotalPages(1)
            }
            finally { setLoading(false) }
        }
        const timer = setTimeout(fetchOrders, 300)
        return () => clearTimeout(timer)
    }, [search, statusFilter, page])

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return
        try {
            await api.delete(`/api/orders/${id}`)
            setOrders(prev => prev.filter(o => o._id !== id))
            toast.success('Order cancelled successfully.')
        } catch {
            toast.error('Failed to cancel order.')
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
                <p className="text-gray-500 text-sm mt-1">View and track all your orders</p>
            </div>
            <div className="glass-card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input-field pl-11" placeholder="Search by order ID or product name..." />
                    </div>
                    <div className="relative">
                        <HiOutlineFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field pl-10 pr-8 min-w-[200px]">
                            <option value="all">All Statuses</option>
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            {loading ? <Loader /> : orders.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {orders.map((order) => <OrderCard key={order._id} order={order} onDelete={handleDelete} />)}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl font-medium transition-all ${p === page ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>{p}</button>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="glass-card p-16 text-center">
                    <HiOutlineClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No orders found</h3>
                    <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                </div>
            )}
        </div>
    )
}

export default MyOrders
