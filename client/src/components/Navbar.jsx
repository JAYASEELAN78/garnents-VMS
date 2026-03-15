import { useState, useEffect, useRef } from 'react'
import { HiOutlineMenuAlt2, HiOutlineBell, HiOutlineX, HiOutlineChatAlt } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Navbar = ({ onMenuClick }) => {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifPanel, setShowNotifPanel] = useState(false)
    const panelRef = useRef(null)

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/api/messages')
            // Client sees admin replies (sender = 'admin')
            const adminReplies = data.filter(m => m.sender === 'admin')
            setNotifications(adminReplies.slice(0, 5))
            const unread = adminReplies.filter(m => !m.isRead)
            setUnreadCount(unread.length)
        } catch (err) {
            // Silent fail
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 8000)
        return () => clearInterval(interval)
    }, [])

    // Close panel on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setShowNotifPanel(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const handleOpenPanel = async () => {
        setShowNotifPanel(p => !p)
        // Mark as read
        if (unreadCount > 0) {
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id)
            if (unreadIds.length) {
                await api.post('/api/messages/mark-read', { ids: unreadIds }).catch(() => { })
                setUnreadCount(0)
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            }
        }
    }

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-800 transition-colors">
                        <HiOutlineMenuAlt2 className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Welcome back, <span className="text-red-600">{user?.name?.split(' ')[0]}</span></h2>
                        <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <div className="relative" ref={panelRef}>
                        <button
                            onClick={handleOpenPanel}
                            className="relative p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-all"
                        >
                            <HiOutlineBell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifPanel && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                                    <button onClick={() => setShowNotifPanel(false)} className="text-gray-400 hover:text-gray-600">
                                        <HiOutlineX className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="max-h-72 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-sm text-gray-400">No notifications yet</div>
                                    ) : notifications.map((n, i) => (
                                        <div key={i} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-red-50/40' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <HiOutlineChatAlt className="w-4 h-4 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-800">Admin replied</p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                                </div>
                                                {!n.isRead && <span className="w-2 h-2 bg-red-500 rounded-full mt-1 shrink-0"></span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                            <p className="text-[11px] text-gray-400">Client</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar
