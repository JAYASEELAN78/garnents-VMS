import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrders } from '../services/orderService'
import {
    HiOutlineViewGrid,
    HiOutlinePlusCircle,
    HiOutlineClipboardList,
    HiOutlineDocumentText,
    HiOutlineUser,
    HiOutlineLogout,
    HiOutlineX,
    HiOutlineCurrencyRupee
} from 'react-icons/hi'

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation()
    const { logout, user } = useAuth()
    const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false)

    useEffect(() => {
        const checkDelivered = async () => {
            try {
                const { data } = await getOrders()
                const orders = Array.isArray(data) ? data : (data.orders || [])
                setHasDeliveredOrder(orders.some(o => o.status?.toUpperCase() === 'DELIVERED'))
            } catch (err) {
                console.error('Failed to check delivered orders', err)
            }
        }
        checkDelivered()
    }, [])

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
        { path: '/place-order', label: 'Place Order', icon: HiOutlinePlusCircle },
        { path: '/my-orders', label: 'My Orders', icon: HiOutlineClipboardList },
        ...(hasDeliveredOrder ? [{ path: '/payments', label: 'Payments', icon: HiOutlineCurrencyRupee }] : []),
        { path: '/invoices', label: 'Invoices', icon: HiOutlineDocumentText },
        { path: '/profile', label: 'Profile', icon: HiOutlineUser },
    ]

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose}></div>}
            <aside className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 shadow-lg lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12">
                                    <img src="/assets/logo.png" alt="VMS Logo" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-red-600 leading-none">V.M.S</h1>
                                    <h1 className="text-lg font-bold text-gray-800">GARMENTS</h1>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Client Portal</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* User info */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold shadow-sm">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.company?.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path
                            return (
                                <Link key={item.path} to={item.path} onClick={onClose}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                                    <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-red-500' : 'group-hover:scale-110'}`} />
                                    <span className="font-medium text-sm">{item.label}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-100">
                        <button onClick={logout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200">
                            <HiOutlineLogout className="w-5 h-5" />
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Sidebar
