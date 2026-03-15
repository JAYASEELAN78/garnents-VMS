import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Users, ShoppingCart, TrendingUp, IndianRupee, Activity, Clock } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
    <Card>
        <CardContent className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
                {trend && (
                    <p className={`text-xs mt-2 font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}% from last month
                    </p>
                )}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        clients: 0,
        activeOrders: 0,
        completedOrders: 0,
        revenue: 0,
        pendingTasks: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                // We simulate a robust dashboard stat endpoint by parallel fetching
                const [usersRes, ordersRes] = await Promise.all([
                    api.get('/api/users?limit=1000'),
                    api.get('/api/orders?limit=1000')
                ]);

                // Backend returns { success: true, data: { users: [...] } }
                const usersData = usersRes.data?.data?.users || usersRes.data?.users || (Array.isArray(usersRes.data) ? usersRes.data : []);
                // Filter out admins to show all customers/staff as clients in the dashboard stat
                const clients = usersData.filter(u => u.role !== 'admin');

                // Orders are usually flat based on my previous edits, but let's be safe
                const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.data?.orders || ordersRes.data?.orders || []);

                const active = orders.filter(o => !['Completed', 'Delivered', 'Cancelled'].includes(o.status));
                const completed = orders.filter(o => ['Completed', 'Delivered'].includes(o.status));
                const revenue = completed.reduce((sum, o) => sum + (Number(o.estimatedCost || o.price || 0)), 0);

                const pendingTasks = orders.filter(o => o.status === 'Pending' || o.status === 'Order Placed').slice(0, 5);
                const recentActivity = [...orders].slice(0, 5);

                setStats({
                    clients: clients.length,
                    activeOrders: active.length,
                    completedOrders: completed.length,
                    revenue: revenue,
                    pendingTasks,
                    recentActivity
                });
            } catch (error) {
                console.error('Failed to load stats', error);
            } finally {
                // Only set loading to false on the very first render, not on background polls
                setLoading(false);
            }
        };
        fetchDashboardStats();

        // Polling mechanism to fetch data every 5 seconds in the background
        const intervalId = setInterval(fetchDashboardStats, 5000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) return <div className="p-8"><Activity className="animate-spin text-blue-600 w-8 h-8" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-sm text-gray-500">Last updated: Just now</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Clients"
                    value={stats.clients}
                    icon={Users}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Active Orders"
                    value={stats.activeOrders}
                    icon={ShoppingCart}
                    colorClass="bg-indigo-50 text-indigo-600"
                />
                <StatCard
                    title="Completed Orders"
                    value={stats.completedOrders}
                    icon={TrendingUp}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Total Revenue (Est)"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    icon={IndianRupee}
                    colorClass="bg-amber-50 text-amber-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardContent>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-400" />
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {stats.recentActivity.length > 0 ? stats.recentActivity.map(order => (
                                <div key={order._id} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600`}>
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium text-gray-900">New Order Placed: {order.order_id || order.orderId}</p>
                                            <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{order.product_name || order.productName} • {order.quantity} {order.unit || 'pcs'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No recent activity found</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            Pending Tasks
                        </h3>
                        <div className="space-y-4">
                            {stats.pendingTasks.length > 0 ? stats.pendingTasks.map(order => (
                                <div key={order._id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                                    <div className="w-2 h-2 mt-2 bg-amber-500 rounded-full shrink-0"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Review pending order {order.order_id || order.orderId}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded">No pending tasks! All caught up.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
