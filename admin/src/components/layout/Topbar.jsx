import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LogOut, Menu, Bell, X, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Topbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const { data } = await api.get('/api/messages');
                // Admin sees only unread messages from clients
                const unread = data.filter(m => m.sender === 'client' && !m.isRead);
                setNotifications(unread.slice(0, 5));
            } catch (err) {
                console.error(err);
            }
        };
        fetchNotifs();
        const intervalId = setInterval(fetchNotifs, 10000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-gray-500 hover:text-gray-700">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="hidden sm:block">
                    <h2 className="text-xl font-semibold text-gray-800">Welcome back, {user?.name || 'Admin'}!</h2>
                    <p className="text-sm text-gray-500">Manage your central dashboard securely.</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <Bell className="w-5 h-5" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                                {notifications.length > 9 ? '9+' : notifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n._id} className="p-4 border-b border-gray-50 hover:bg-blue-50/50 transition-colors cursor-pointer bg-red-50/30" onClick={() => { setShowNotifications(false); navigate('/messages'); }}>
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                    <MessageSquare className="w-4 h-4 text-orange-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-gray-800">{n.client_id?.name || 'Client'}</p>
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div
                                className="p-3 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                                onClick={() => { setShowNotifications(false); navigate('/messages'); }}
                            >
                                View all messages
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex flex-col items-center justify-center text-sm border-2 border-white shadow-sm shadow-blue-200">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header >
    );
};

export default Topbar;
