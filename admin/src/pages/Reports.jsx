import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, Download, ShoppingCart, CheckCircle,
    Clock, Package, Users, FileText, Truck, Activity
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    Pending: '#f59e0b',
    Processing: '#3b82f6',
    'In Production': '#8b5cf6',
    'Quality Check': '#06b6d4',
    Completed: '#10b981',
    Dispatched: '#6366f1',
    Delivered: '#22c55e',
    Cancelled: '#ef4444'
};
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#6366f1', '#22c55e'];

const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
        </div>
    </div>
);

const ReportsPage = () => {
    const [orders, setOrders] = useState([]);
    const [productions, setProductions] = useState([]);
    const [dispatches, setDispatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('all');

    const fetchData = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const [ordersRes, prodRes, dispatchRes] = await Promise.all([
                api.get('/api/orders'),
                api.get('/api/production'),
                api.get('/api/dispatches')
            ]);
            setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
            setProductions(Array.isArray(prodRes.data) ? prodRes.data : []);
            setDispatches(Array.isArray(dispatchRes.data) ? dispatchRes.data : []);
        } catch {
            if (isInitial) toast.error('Failed to load report data');
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true);
        // Real-time sync interval (30 seconds)
        const interval = setInterval(() => fetchData(false), 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter by date range
    const filterByDate = (items) => items.filter(o => {
        if (dateRange === 'all') return true;
        const created = new Date(o.createdAt);
        const now = new Date();
        if (dateRange === '7d') return (now - created) <= 7 * 86400000;
        if (dateRange === '30d') return (now - created) <= 30 * 86400000;
        if (dateRange === '90d') return (now - created) <= 90 * 86400000;
        return true;
    });

    const filtered = filterByDate(orders);
    const filteredProd = filterByDate(productions);
    const filteredDispatch = filterByDate(dispatches);

    // Stat computations
    const total = filtered.length;
    const delivered = filtered.filter(o => o.status === 'Delivered').length;
    const pending = filtered.filter(o => o.status === 'Pending').length;

    // Status distribution for Pie
    const statusCounts = {};
    filtered.forEach(o => {
        statusCounts[o.status || 'Unknown'] = (statusCounts[o.status || 'Unknown'] || 0) + 1;
    });
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Priority distribution for Bar
    const priorityCounts = {};
    filtered.forEach(o => {
        priorityCounts[o.priority || 'Normal'] = (priorityCounts[o.priority || 'Normal'] || 0) + 1;
    });
    const barData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

    // Monthly orders trend (last 6 months)
    const monthlyMap = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short' });
        monthlyMap[key] = 0;
    }
    filtered.forEach(o => {
        const d = new Date(o.createdAt);
        const key = d.toLocaleString('default', { month: 'short' });
        if (monthlyMap[key] !== undefined) monthlyMap[key]++;
    });
    const trendData = Object.entries(monthlyMap).map(([month, orders]) => ({ month, orders }));

    const handleExport = () => {
        // Status priority map for sorting
        const priorityMap = {
            'Pending': 1,
            'Dispatched': 2
        };

        // Create a sorted copy of the filtered orders
        const sortedData = [...filtered].sort((a, b) => {
            const pA = priorityMap[a.status] || 99;
            const pB = priorityMap[b.status] || 99;
            if (pA !== pB) return pA - pB;
            // Secondary sort by date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Generate HTML Table for perfect Excel "proper alignment and line space"
        const tableHeader = ['Order ID', 'Client Name', 'Product', 'Quantity', 'Unit', 'Status', 'Priority', 'Delivery Date', 'Created Date'];
        
        let htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th { background-color: #f3f4f6; color: #374151; font-weight: bold; border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                    td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; vertical-align: middle; }
                    .pending { color: #f59e0b; }
                    .dispatched { color: #6366f1; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>${tableHeader.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${sortedData.map(o => `
                            <tr>
                                <td>${o.order_id || ''}</td>
                                <td>${o.user_id?.name || 'N/A'}</td>
                                <td>${o.product_name || ''}</td>
                                <td>${o.quantity || ''}</td>
                                <td>${o.unit || ''}</td>
                                <td class="${(o.status || '').toLowerCase()}">${o.status || ''}</td>
                                <td>${o.priority || ''}</td>
                                <td>${o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : ''}</td>
                                <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        
        const blob = new Blob(['\uFEFF', htmlContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VMS_Orders_Report_${new Date().toISOString().slice(0, 10)}.xls`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Excel report exported!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-600" /> Analytics & Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Comprehensive view of business performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="all">All Time</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                    </select>
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-16 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Loading report data...
                </div>
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatCard icon={ShoppingCart} label="Total Orders" value={total} subtext="In selected period" color="bg-blue-500" />
                        <StatCard icon={CheckCircle} label="Delivered" value={delivered} subtext={`${total ? Math.round(delivered / total * 100) : 0}% completion rate`} color="bg-emerald-500" />
                        <StatCard icon={Clock} label="Pending" value={pending} subtext="Awaiting processing" color="bg-amber-500" />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Status Distribution (Donut) */}

                        {/* Order Status Distribution (Donut) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" /> Order Status Distribution
                            </h2>
                            <p className="text-xs text-gray-400 mb-4">Breakdown of all orders by status</p>
                            
                            <div className="h-60">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            formatter={(value) => [value, `Count`]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3">
                                {pieData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                        <span className="text-sm font-semibold text-gray-600">
                                            {entry.name} <span className="text-gray-400 font-normal">({entry.value})</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bar Chart - Priority */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-base font-semibold text-gray-800 mb-1">Orders by Priority</h2>
                            <p className="text-xs text-gray-400 mb-4">Distribution of order urgency levels</p>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barSize={48}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                                        <RechartsTooltip cursor={{ fill: '#f9fafb' }} />
                                        <Bar dataKey="value" name="Orders" radius={[6, 6, 0, 0]}>
                                            {barData.map((entry, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Area Chart - Monthly Trend */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                                <h2 className="text-base font-semibold text-gray-800">Monthly Order Trend</h2>
                                <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">Historical Trend</p>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">Number of orders placed over the last 6 months</p>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                                        <RechartsTooltip />
                                        <Area type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorOrders)" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Order Summary Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-500" /> Order Summary Table
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">{filtered.length} orders in selected period</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Order ID', 'Client', 'Product', 'Qty', 'Status', 'Priority', 'Delivery Date', 'Created'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[...filtered].sort((a, b) => {
                                        const statusPriority = { 'Pending': 1, 'Dispatched': 2 };
                                        const pA = statusPriority[a.status] || 99;
                                        const pB = statusPriority[b.status] || 99;
                                        if (pA !== pB) return pA - pB;
                                        return new Date(b.createdAt) - new Date(a.createdAt); // Newest first for same status
                                    }).slice(0, 20).map(o => (
                                        <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.order_id}</td>
                                            <td className="px-4 py-3 text-gray-600 font-medium">{o.user_id?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{o.product_name}</td>
                                            <td className="px-4 py-3 text-gray-600">{o.quantity} {o.unit}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                                    style={{ backgroundColor: `${STATUS_COLORS[o.status] || '#6b7280'}20`, color: STATUS_COLORS[o.status] || '#6b7280' }}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold uppercase ${o.priority === 'urgent' ? 'text-red-600' : o.priority === 'high' ? 'text-orange-500' : 'text-gray-500'}`}>
                                                    {o.priority || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : '—'}</td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-400">No orders found in selected period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            {filtered.length > 20 && (
                                <p className="text-center text-xs text-gray-400 py-3 border-t border-gray-50">
                                    Showing 20 of {filtered.length} orders. Export CSV to see all.
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsPage;
