import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getOrderStats } from '../services/orderService'
import { getStatusColor, formatDate } from '../utils/helpers'
import Loader from '../components/Loader'
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineCheckCircle, HiOutlineTruck, HiOutlineArrowRight, HiOutlinePlusCircle } from 'react-icons/hi'

const Dashboard = () => {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try { const { data } = await getOrderStats(); setStats(data) }
            catch (err) { console.error(err) }
            finally { setLoading(false) }
        }
        fetchStats()
    }, [])

    if (loading) return <Loader />

    const statusMap = {}
    stats?.statuses?.forEach(s => { statusMap[s._id] = s.count })

    const cards = [
        { label: 'Total Orders', value: stats?.total || 0, icon: HiOutlineClipboardList, color: 'from-red-500 to-red-600', bg: 'bg-red-50', iconColor: 'text-red-500' },
        { label: 'In Progress', value: (statusMap['Pending'] || 0) + (statusMap['Material Received'] || 0) + (statusMap['Processing'] || 0) + (statusMap['Quality Check'] || 0), icon: HiOutlineClock, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', iconColor: 'text-amber-500' },
        { label: 'Completed', value: statusMap['Completed'] || 0, icon: HiOutlineCheckCircle, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
        { label: 'Dispatched', value: (statusMap['Dispatched'] || 0) + (statusMap['Delivered'] || 0), icon: HiOutlineTruck, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', iconColor: 'text-blue-500' },
    ]

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Overview of your order activity</p>
                </div>
                <Link to="/place-order" className="btn-primary flex items-center gap-2">
                    <HiOutlinePlusCircle className="w-5 h-5" /> Place New Order
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {cards.map((card, i) => (
                    <div key={i} className="glass-card p-6 hover:border-red-200 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                            </div>
                            <span className="text-3xl font-bold text-gray-800">{card.value}</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="glass-card overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
                    <Link to="/my-orders" className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                        View All <HiOutlineArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                {stats?.recentOrders?.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {stats.recentOrders.map((order) => (
                            <Link key={order._id} to={`/orders/${order._id}`}
                                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                        <HiOutlineClipboardList className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{order.product_name || order.productName}</p>
                                        <p className="text-xs text-gray-400">{order.order_id || order.orderId} · {formatDate(order.createdAt)}</p>
                                    </div>
                                </div>
                                <span className={`status-badge border ${getStatusColor(order.status)}`}>{order.status}</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center">
                        <HiOutlineClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400">No orders yet</p>
                        <Link to="/place-order" className="text-sm text-red-500 hover:text-red-600 mt-2 inline-block">Place your first order</Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
