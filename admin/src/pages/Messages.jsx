import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { MessageSquare, Send, Reply, User } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({ client_id: '', message: '', order_id: '' });
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); // the message being replied to
    const [replyText, setReplyText] = useState('');

    const fetchData = async (isInitial = false) => {
        try {
            const [msgRes, clientRes] = await Promise.all([
                api.get('/api/messages'),
                api.get('/api/users')
            ]);
            setMessages(msgRes.data);
            const usersArray = clientRes.data?.data?.users || clientRes.data?.users || (Array.isArray(clientRes.data) ? clientRes.data : []);
            setClients(usersArray.filter(u => u.role === 'client'));
        } catch (error) {
            // Only show error toast on first load, not on background polls
            if (isInitial) toast.error('Failed to load messages');
            else console.warn('Background refresh failed:', error.message);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true); // initial load
        const interval = setInterval(() => fetchData(false), 8000); // silent polling
        return () => clearInterval(interval);
    }, []);

    // Admin composes a new message
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.client_id || !form.message) return toast.error('Client and Message are required');
        try {
            const { data } = await api.post('/api/messages/reply', form);
            setMessages(prev => [data, ...prev]);
            setForm({ client_id: '', message: '', order_id: '' });
            toast.success('Message sent to client!');
        } catch {
            toast.error('Failed to send message');
        }
    };

    // Admin replies inline to a specific client message
    const handleReply = async (msg) => {
        if (!replyText.trim()) return;
        try {
            const { data } = await api.post('/api/messages/reply', {
                client_id: msg.client_id?._id || msg.client_id,
                order_id: msg.order_id?._id || msg.order_id,
                message: replyText
            });
            setMessages(prev => [data, ...prev]);
            setReplyingTo(null);
            setReplyText('');
            toast.success('Reply sent!');
        } catch {
            toast.error('Failed to reply');
        }
    };

    // Group messages by client
    const clientMessages = messages.filter(m => m.sender === 'client');
    const unreadCount = clientMessages.filter(m => !m.isRead).length;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Messages & Communication</h1>
                </div>
                {unreadCount > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                        {unreadCount} unread message{unreadCount > 1 ? 's' : ''} from clients
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compose New Message */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader title="Compose Message" subtitle="Send message to client" />
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Select Client</label>
                                <select
                                    value={form.client_id}
                                    onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Choose a client...</option>
                                    {clients.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Order ID (Optional)</label>
                                <input
                                    type="text"
                                    value={form.order_id}
                                    onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Reference Order"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Message Body</label>
                                <textarea
                                    required
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Type message here..."
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary">
                                <Send className="w-4 h-4" /> Send Message
                            </button>
                        </form>
                    </CardContent>
                </Card>

                {/* Message History with Reply */}
                <Card className="lg:col-span-2">
                    <CardHeader title="Message History" subtitle="All client conversations" />
                    <CardContent>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {loading ? <p className="text-center text-gray-500 py-8">Loading messages...</p> :
                                messages.length === 0 ? <p className="text-center text-gray-500 py-8">No messages yet.</p> :
                                    messages.map((msg) => (
                                        <div key={msg._id} className={`p-4 rounded-xl border ${msg.sender === 'admin' ? 'bg-blue-50 border-blue-100 ml-12' : 'bg-white border-gray-200 shadow-sm mr-12'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${msg.sender === 'admin' ? 'bg-blue-200' : 'bg-orange-100'}`}>
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-sm text-gray-900">
                                                            {msg.sender === 'admin' ? 'You (Admin)' : msg.client_id?.name || 'Client'}
                                                        </span>
                                                        {!msg.isRead && msg.sender === 'client' && (
                                                            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full font-bold">NEW</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(msg.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap mb-2">{msg.message}</p>
                                            {msg.order_id && (
                                                <div className="mb-2 text-xs font-medium text-blue-600 bg-blue-100/50 inline-block px-2 py-1 rounded">
                                                    Ref Order: {msg.order_id.order_id || msg.order_id}
                                                </div>
                                            )}
                                            {/* Inline Reply Button - only for client messages */}
                                            {msg.sender === 'client' && (
                                                <div className="mt-2">
                                                    {replyingTo === msg._id ? (
                                                        <div className="flex gap-2 mt-2">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={replyText}
                                                                onChange={e => setReplyText(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleReply(msg)}
                                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                placeholder="Type your reply..."
                                                            />
                                                            <button
                                                                onClick={() => handleReply(msg)}
                                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                                                            >
                                                                <Send className="w-3.5 h-3.5" /> Send
                                                            </button>
                                                            <button
                                                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                                                            >Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setReplyingTo(msg._id); setReplyText(''); }}
                                                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                                                        >
                                                            <Reply className="w-3.5 h-3.5" /> Reply
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
export default MessagesPage;
