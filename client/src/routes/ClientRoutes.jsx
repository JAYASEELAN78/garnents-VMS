import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Dashboard from '../pages/Dashboard'
import PlaceOrder from '../pages/PlaceOrder'
import MyOrders from '../pages/MyOrders'
import OrderDetails from '../pages/OrderDetails'
import Invoices from '../pages/Invoices'
import Payments from '../pages/Payments'
import Profile from '../pages/Profile'

const ClientRoutes = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="lg:ml-72">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="p-6 lg:p-8">
                    <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/place-order" element={<PlaceOrder />} />
                        <Route path="/my-orders" element={<MyOrders />} />
                        <Route path="/orders/:id" element={<OrderDetails />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/payments" element={<Payments />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}

export default ClientRoutes
