import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderById } from '../services/orderService'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { ORDER_STATUSES, formatDate, formatDateTime, getStatusColor, getPriorityColor } from '../utils/helpers'
import Loader from '../components/Loader'
import toast from 'react-hot-toast'
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlinePaperAirplane, HiOutlineTrash, HiOutlineExclamationCircle, HiOutlineDownload, HiOutlinePhotograph, HiOutlineEye } from 'react-icons/hi'
import { deleteOrder } from '../services/orderService'
import { useNavigate } from 'react-router-dom'

const OrderDetails = () => {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [showConfirm, setShowConfirm] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [showNegotiate, setShowNegotiate] = useState(false)
    const [counterPrice, setCounterPrice] = useState('')
    const [isSubmittingCounter, setIsSubmittingCounter] = useState(false)
    const [showDesignModal, setShowDesignModal] = useState(false)
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await getOrderById(id);
                setOrder(data)
            } catch (err) { console.error(err) }
            finally { setLoading(false) }
        }
        fetchOrder()
    }, [id])

    // Fetch messages and auto-refresh so admin replies appear in real time
    const fetchMessages = async () => {
        try {
            const { data: msgs } = await api.get('/api/messages')
            // Fix: compare as strings since order_id is a populated ObjectId
            const orderMsgs = msgs.filter(m => {
                const oid = m.order_id?._id?.toString() || m.order_id?.toString()
                return oid === id
            })
            setMessages(orderMsgs.reverse())
        } catch (err) { console.error('Message fetch error:', err) }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000) // poll every 5s
        return () => clearInterval(interval)
    }, [id])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!message.trim()) return
        try {
            const { data } = await api.post('/api/messages', {
                client_id: user?._id || user?.id,
                order_id: id,
                message
            })
            setMessages(prev => [...prev, data])
            setMessage('')
            toast.success('Message sent to admin!')
        } catch (err) { toast.error('Failed to send') }
    }
    const handleCancelOrder = async () => {
        setIsCancelling(true)
        try {
            await deleteOrder(id)
            toast.success('Order cancelled successfully')
            navigate('/my-orders')
        } catch (err) {
            toast.error('Failed to cancel order')
            setIsCancelling(false)
        }
    }

    const handleNegotiate = async (e) => {
        e.preventDefault()
        if (!counterPrice) {
            toast.error('Please enter a price')
            return
        }
        setIsSubmittingCounter(true)
        try {
            await api.put(`/api/orders/${id}`, {
                estimatedCost: Number(counterPrice),
                priceStatus: 'Negotiating'
            });
            
            // Also send a message to admin
            await api.post('/api/messages', {
                client_id: user?._id || user?.id,
                order_id: id,
                message: `Counter offer sent: ₹${Number(counterPrice).toLocaleString()}`
            });

            setOrder({ ...order, estimatedCost: Number(counterPrice), priceStatus: 'Negotiating' });
            setShowNegotiate(false);
            toast.success('Counter offer sent!');
        } catch (err) {
            toast.error('Failed to send counter offer')
        } finally {
            setIsSubmittingCounter(false)
        }
    }

    const getDesignUrl = (filePath) => {
        if (!filePath) return '';
        if (filePath.startsWith('http')) return filePath;
        // Strip leading slash or /uploads/ prefix if present to avoid duplication
        const cleanPath = filePath.replace(/^\/?(uploads\/)?/, '');
        return `http://localhost:5000/uploads/${cleanPath}`;
    }

    const getDownloadUrl = (filePath) => {
        if (!filePath) return '';
        // Strip any path prefixes, keep only the filename
        const filename = filePath.replace(/^\/?(uploads\/)?/, '');
        return `http://localhost:5000/api/orders/download/${filename}`;
    }

    if (loading) return <Loader />
    if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>

    const currentIdx = ORDER_STATUSES.indexOf(order.status)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/my-orders" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm">
                    <HiOutlineArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{order.order_id || order.orderId}</h1>
                    <p className="text-gray-500 text-sm">{order.product_name || order.productName} · <span className={`font-semibold ${getPriorityColor(order.priority)}`}>{order.priority?.toUpperCase()}</span></p>
                </div>
                <span className={`status-badge border ml-auto ${getStatusColor(order.status)}`}>{order.status}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    {(order.priceStatus === 'Quoted' || order.priceStatus === 'Negotiating') && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                        <HiOutlineCheckCircle className="w-5 h-5" />
                                        {order.priceStatus === 'Quoted' ? 'Price Quote Received' : 'Price Negotiation in Progress'}
                                    </h3>
                                    <p className="text-amber-700 text-sm mt-1">
                                        {order.priceStatus === 'Quoted' 
                                            ? `Admin has quoted `
                                            : `You have sent a counter offer of `}
                                        <span className="font-bold text-lg text-amber-900">₹{order.estimatedCost?.toLocaleString()}</span> 
                                        {order.priceStatus === 'Quoted' 
                                            ? ` for this order. Please confirm this price so we can start procuring materials.`
                                            : ` for this order. Waiting for admin response.`}
                                    </p>
                                    {order.priceStatus === 'Quoted' && (
                                        <p className="text-amber-800 text-sm mt-2 font-medium">
                                            For negotiation, contact Admin: <a href="tel:9080573831" className="underline decoration-amber-400 underline-offset-4">9080573831</a>
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                                    {order.priceStatus === 'Quoted' && (
                                        <>
                                            {!showNegotiate && (
                                                <button
                                                    onClick={() => {
                                                        setShowNegotiate(true);
                                                        setCounterPrice(order.estimatedCost);
                                                    }}
                                                    className="px-5 py-2.5 border border-amber-300 text-amber-700 bg-white rounded-xl text-sm font-bold hover:bg-amber-50 transition-all shadow-sm"
                                                >
                                                    Negotiate
                                                </button>
                                            )}
                                            
                                            {!showConfirm && (
                                                <button
                                                    onClick={() => setShowConfirm(true)}
                                                    className="px-5 py-2.5 border border-pink-200 text-red-500 bg-white rounded-xl text-sm font-bold hover:bg-pink-50 transition-all shadow-sm"
                                                >
                                                    Cancel Order
                                                </button>
                                            )}

                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.put(`/api/orders/${id}`, { priceStatus: 'Confirmed' });
                                                        setOrder({ ...order, priceStatus: 'Confirmed' });
                                                        toast.success('Price accepted! Work will commence shortly.');
                                                    } catch (e) { toast.error('Failed to accept price'); }
                                                }}
                                                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md transition-all hover:scale-[1.02] whitespace-nowrap"
                                            >
                                                Accept Price
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Custom Confirmation Box */}
                            {showConfirm && (
                                <div className="bg-red-50/50 border-2 border-red-200 rounded-2xl p-5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <HiOutlineExclamationCircle className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-red-900 font-bold text-base mb-1">Are you sure you want to cancel this order?</h4>
                                            <p className="text-red-700 text-sm mb-4">This action cannot be undone. The order will be permanently cancelled.</p>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={handleCancelOrder} 
                                                    disabled={isCancelling}
                                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                                                >
                                                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                                                </button>
                                                <button 
                                                    onClick={() => setShowConfirm(false)}
                                                    className="px-5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-bold shadow-sm transition-all"
                                                >
                                                    No, Keep Order
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {showNegotiate && (
                                <form onSubmit={handleNegotiate} className="mt-4 p-4 bg-white border border-amber-200 rounded-xl shadow-inner flex flex-col md:flex-row gap-4 items-end animate-fade-in">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-amber-900 mb-1 uppercase">Your Counter Offer (₹)</label>
                                        <input
                                            type="number"
                                            value={counterPrice}
                                            onChange={(e) => setCounterPrice(e.target.value)}
                                            className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                            placeholder="Enter amount..."
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => setShowNegotiate(false)}
                                            className="px-4 py-2 text-gray-400 hover:text-gray-600 text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingCounter}
                                            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold shadow-md disabled:opacity-50 flex-1 md:flex-none"
                                        >
                                            {isSubmittingCounter ? 'Sending...' : 'Send Counter Offer'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                    {/* Timeline */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Order Progress</h2>
                        <div className="relative">
                            {ORDER_STATUSES.map((status, index) => {
                                const isCompleted = index <= currentIdx
                                const isCurrent = index === currentIdx
                                const timelineEntry = order.timeline?.find(t => t.status === status)
                                return (
                                    <div key={status} className="flex gap-4 pb-6 last:pb-0">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                isCurrent && status !== 'Delivered' ? 'bg-red-500 shadow-lg shadow-red-500/30 ring-4 ring-red-100' :
                                                isCompleted ? 'bg-emerald-500 shadow-sm' : 'bg-gray-100 border-2 border-gray-300'}`}>
                                                {isCompleted ? <HiOutlineCheckCircle className="w-5 h-5 text-white" /> : <span className="text-xs text-gray-400">{index + 1}</span>}
                                            </div>
                                            {index < ORDER_STATUSES.length - 1 && <div className={`w-0.5 flex-1 mt-2 ${isCompleted ? 'bg-emerald-400' : 'bg-gray-200'}`}></div>}
                                        </div>
                                        <div className="flex-1 pt-1.5">
                                            <p className={`font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>{status}</p>
                                            {timelineEntry && <p className="text-xs text-gray-400 mt-1">{formatDateTime(timelineEntry.date)}{timelineEntry.note && ` — ${timelineEntry.note}`}</p>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Messages</h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1">
                            {messages.length > 0 ? messages.map((msg, i) => (
                                <div key={i} className={`p-3 rounded-xl max-w-[80%] ${msg.sender === 'client' ? 'ml-auto bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-200'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-gray-600">{msg.sender === 'client' ? 'You' : 'Admin'}</span>
                                        <span className="text-[10px] text-gray-400">{formatDateTime(msg.createdAt || msg.date)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{msg.message}</p>
                                </div>
                            )) : <p className="text-gray-400 text-sm text-center py-4">No messages yet. Send a message to the admin!</p>}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex gap-3">
                            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className="input-field flex-1" placeholder="Send a message to admin..." />
                            <button type="submit" className="btn-primary px-4"><HiOutlinePaperAirplane className="w-5 h-5 rotate-90" /></button>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h3>
                        <div className="space-y-3 text-sm">
                            {[
                                { l: 'Product', v: order.product_name || order.productName },
                                { l: 'Quantity', v: `${order.quantity} ${order.unit}` },
                                { l: 'Priority', v: order.priority?.toUpperCase(), c: getPriorityColor(order.priority) },
                                { l: 'Delivery Date', v: formatDate(order.delivery_date || order.deliveryDate) },
                                { l: 'Est. Cost', v: order.estimatedCost ? `₹${order.estimatedCost.toLocaleString()}` : 'N/A' },
                                { l: 'Created', v: formatDate(order.createdAt) },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                    <span className="text-gray-400">{item.l}</span>
                                    <span className={`font-medium ${item.c || 'text-gray-800'}`}>{item.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {order.description && (
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{order.description}</p>
                        </div>
                    )}

                    {/* Shared Design File Section */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Shared Design</h3>
                            {order.designFile && (
                                <button 
                                    onClick={() => setShowDesignModal(true)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    title="View Full Resolution"
                                >
                                    <HiOutlineEye className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        {order.designFile ? (
                            <div className="space-y-4">
                                {['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].some(ext => (order.designFile || '').toLowerCase().endsWith(ext)) ? (
                                    <div className="relative group overflow-hidden rounded-xl border border-gray-100 bg-gray-50 aspect-video flex items-center justify-center">
                                        <img 
                                            src={getDesignUrl(order.designFile)} 
                                            alt="Order Design" 
                                            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <HiOutlinePhotograph className="w-8 h-8 text-white/50" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                                            <HiOutlinePhotograph className="w-6 h-6 text-red-500" />
                                        </div>
                                        <p className="text-xs font-medium text-gray-800 break-all px-4 text-center">{order.designFile.replace(/^\/?uploads\//, '')}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Design document shared</p>
                                    </div>
                                )}
                                
                                <a 
                                    href={getDownloadUrl(order.designFile)} 
                                    download
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/10 transition-all hover:translate-y-[-1px]"
                                >
                                    <HiOutlineDownload className="w-4 h-4" />
                                    Download Design File
                                </a>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                                <p className="text-xs text-gray-400 italic text-center px-4">No design file shared for this order.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Design Modal Lightbox */}
            {showDesignModal && order.designFile && (
                <div 
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 animate-fade-in"
                    onClick={() => setShowDesignModal(false)}
                >
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
                    
                    <button 
                        onClick={() => setShowDesignModal(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[1001] border border-white/20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div 
                        className="relative max-w-full max-h-full z-[1001] animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].some(ext => (order.designFile || '').toLowerCase().endsWith(ext)) ? (
                            <img 
                                src={getDesignUrl(order.designFile)} 
                                alt="Full Resolution Design" 
                                className="max-w-screen max-h-[90vh] object-contain rounded-lg shadow-2xl border-4 border-white/10"
                            />
                        ) : (
                            <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-md">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                    <HiOutlinePhotograph className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Non-Image Design File</h3>
                                <p className="text-gray-500 mb-8">This file type cannot be previewed directly. Please download it to view.</p>
                                <a 
                                    href={getDesignUrl(order.designFile)} 
                                    download
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg transition-all"
                                >
                                    Download Now
                                </a>
                            </div>
                        )}
                        
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
                            {order.designFile.replace(/^\/?uploads\//, '')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OrderDetails
