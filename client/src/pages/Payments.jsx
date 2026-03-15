import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getOrders } from '../services/orderService'
import toast from 'react-hot-toast'
import {
    HiOutlineCurrencyRupee,
    HiOutlineCreditCard,
    HiOutlineRefresh,
    HiOutlineDocumentText,
    HiOutlineQrcode,
    HiOutlineLibrary,
    HiX
} from 'react-icons/hi'
import { SiPhonepe, SiGooglepay } from 'react-icons/si'
import { formatDate } from '../utils/helpers'
import { loadStripe } from '@stripe/stripe-js'
import { motion, AnimatePresence } from 'framer-motion'
import qrCodeImage from '../assets/qr-code.png'

const Payments = () => {
    const navigate = useNavigate()
    const [payments, setPayments] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [selectedMethod, setSelectedMethod] = useState(null)
    const [showQRModal, setShowQRModal] = useState(false)

    const paymentMethods = [
        { id: 'upi', name: 'UPI', icon: <SiPhonepe className="text-purple-600" />, desc: 'PhonePe, GPay, Paytm' },
        { id: 'card', name: 'Card', icon: <HiOutlineCreditCard className="text-blue-600" />, desc: 'Debit / Credit Card' },
        { id: 'netbanking', name: 'Net Banking', icon: <HiOutlineLibrary className="text-green-600" />, desc: 'All Indian Banks' },
        { id: 'qr', name: 'QR Code', icon: <HiOutlineQrcode className="text-red-600" />, desc: 'Scan and Pay' }
    ]

    useEffect(() => {
        fetchData();
        const query = new URLSearchParams(window.location.search);
        if (query.get("success") && query.get("orderId")) {
            const orderId = query.get("orderId");
            // Clean URL immediately to prevent double processing/toasts
            window.history.replaceState({}, document.title, window.location.pathname);
            verifyPayment(orderId);
        } else if (query.get("canceled")) {
            toast.error("Payment Declined");
            // Clean URL immediately
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [])

    const verifyPayment = async (orderId) => {
        try {
            const { data } = await api.post('/api/stripe/verify', { orderId });
            if (data.success) {
                toast.success("Payment Verified Successful");
                fetchData();
            }
        } catch (err) {
            console.error("Verification failed", err);
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const [paymentsRes, ordersRes] = await Promise.all([
                api.get('/api/payments'),
                getOrders()
            ])
            setPayments(paymentsRes.data.data || paymentsRes.data)
            const fetchedOrders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data.orders || [])
            setOrders(fetchedOrders.filter(o => o.status?.toUpperCase() === 'DELIVERED'))
        } catch (err) {
            toast.error('Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    const initiatePayment = (order) => {
        setSelectedOrder(order)
        setShowModal(true)
    }

    const handlePayment = async () => {
        if (!selectedMethod) {
            toast.error('Please select a payment method')
            return
        }

        if (selectedMethod.id === 'qr') {
            setShowModal(false)
            setShowQRModal(true)
            return
        }

        const order = selectedOrder
        setShowModal(false)
        setLoading(true)

        const baseAmount = order.finalCost || order.estimatedCost || order.price || 0;
        const cgst = baseAmount * 0.025;
        const sgst = baseAmount * 0.025;
        const grandTotal = baseAmount + cgst + sgst;

        try {
            const { data } = await api.post('/api/stripe/create-checkout-session', {
                amount: grandTotal,
                orderId: order._id
            })

            if (data.simulated) {
                toast.success("Simulated payment success! Redirecting...")
                setTimeout(() => {
                    window.location.href = data.url
                }, 1500)
                return
            }

            if (data.url) {
                window.location.href = data.url;
            }

        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment initiation failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-fade-in relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Payments</h1>
                    <p className="text-gray-500 text-sm mt-1">Track your financial transactions and order details</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                >
                    <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Order Details Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-700">Order Details (Delivered)</h2>
                </div>
                <div className="glass-card overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                {['Order ID', 'Product', 'Quantity', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : orders.length > 0 ? orders.map(order => (
                                <tr key={order._id} className="hover:bg-gray-50 transition-colors text-sm">
                                    <td className="px-6 py-4 font-mono font-medium text-red-600">{order.order_id || order.orderId}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{order.product_name || order.productName}</td>
                                    <td className="px-6 py-4 text-gray-600">{order.quantity} {order.unit}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 line-through">₹{(order.finalCost || order.estimatedCost || order.price || 0).toLocaleString()}</span>
                                            <span className="font-bold text-gray-900">₹{((order.finalCost || order.estimatedCost || order.price || 0) * 1.05).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`status-badge border bg-green-100 text-green-600 border-green-200`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{formatDate(order.delivery_date || order.deliveryDate)}</td>
                                    <td className="px-6 py-4">
                                        {order.payment_status === 'Paid' ? (
                                            <span className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-black uppercase tracking-wider border border-green-100">
                                                <HiOutlineCurrencyRupee className="w-4 h-4" /> Paid
                                            </span>
                                        ) : (order.priceStatus !== 'Confirmed' && order.priceStatus !== 'Finalized') ? (
                                            <span className="flex items-center justify-center text-center px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                                                Awaiting Final Amount
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => initiatePayment(order)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-xs font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-md shadow-red-200 uppercase tracking-wider w-full justify-center"
                                            >
                                                <HiOutlineCurrencyRupee className="w-4 h-4" /> Pay Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">No delivered orders found in your history</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment History Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <HiOutlineCreditCard className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-700">Payment History</h2>
                </div>
                <div className="glass-card overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                {['Payment ID', 'Type', 'Amount', 'Date', 'Status'].map(h => (
                                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : payments.length > 0 ? payments.map(pmt => (
                                <tr key={pmt._id} className="hover:bg-gray-50 transition-colors text-sm">
                                    <td className="px-6 py-4 font-bold text-gray-800">#{pmt._id?.slice(-8).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-gray-700">{pmt.type}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">₹{pmt.amount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-500">{formatDate(pmt.date)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`status-badge border ${pmt.status === 'Completed' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                                            {pmt.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No payment records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Method Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Select Payment Method</h3>
                                        <p className="text-gray-500 text-sm">Secure payment for Order {selectedOrder?.order_id}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <HiX className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 mb-8">
                                    {paymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedMethod?.id === method.id
                                                ? 'border-red-600 bg-red-50 ring-4 ring-red-50'
                                                : 'border-gray-100 hover:border-red-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                                                {method.icon}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{method.name}</div>
                                                <div className="text-xs text-gray-500">{method.desc}</div>
                                            </div>
                                            {selectedMethod?.id === method.id && (
                                                <div className="ml-auto w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={!selectedMethod}
                                        onClick={handlePayment}
                                        className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Proceed to Pay
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 space-y-2 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Product Price:</span>
                                    <span className="text-gray-800 font-bold">₹{(selectedOrder?.finalCost || selectedOrder?.estimatedCost || selectedOrder?.price || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">CGST (2.5%):</span>
                                    <span className="text-gray-800 font-bold">₹{((selectedOrder?.finalCost || selectedOrder?.estimatedCost || selectedOrder?.price || 0) * 0.025).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">SGST (2.5%):</span>
                                    <span className="text-gray-800 font-bold">₹{((selectedOrder?.finalCost || selectedOrder?.estimatedCost || selectedOrder?.price || 0) * 0.025).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                    <div className="flex items-center gap-2">
                                        <HiOutlineCurrencyRupee className="text-red-600 w-5 h-5" />
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total to Pay:</span>
                                    </div>
                                    <span className="text-xl font-black text-red-600">₹{((selectedOrder?.finalCost || selectedOrder?.estimatedCost || selectedOrder?.price || 0) * 1.05).toLocaleString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Manual QR Payment Modal */}
            <AnimatePresence>
                {showQRModal && (
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQRModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="text-center">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-gray-800">Scan to Pay</h3>
                                    <button
                                        onClick={() => setShowQRModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <HiX className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                        <div className="relative bg-white p-6 rounded-[1.8rem] border border-gray-100">
                                            <img
                                                src={qrCodeImage}
                                                alt="UPI QR Code"
                                                className="w-full aspect-square rounded-xl shadow-inner border border-gray-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">UPI Details</div>
                                        <div className="font-black text-gray-800 text-lg">JAYASEELAN. S</div>
                                        <div className="text-sm font-mono text-read-600 font-bold bg-red-50 inline-block px-2 py-0.5 rounded-lg mt-1">
                                            jayaseelanjaya67@okhdfcbank
                                        </div>
                                    </div>

                                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                        <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Amount to Pay</div>
                                        <div className="text-2xl font-black text-green-700">₹{((selectedOrder?.finalCost || selectedOrder?.estimatedCost || selectedOrder?.price || 0) * 1.05).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => {
                                            toast.success('Payment notification sent to admin!')
                                            setShowQRModal(false)
                                        }}
                                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black text-lg hover:from-red-700 hover:to-red-800 transition-all shadow-xl shadow-red-200"
                                    >
                                        I have paid
                                    </button>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                                        Admin will verify and update your status shortly
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Payments
