import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { HiOutlineDocumentText, HiOutlineDownload, HiOutlineClipboardList } from 'react-icons/hi'
import { formatDate } from '../utils/helpers'

const Invoices = () => {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInvoices()
    }, [])

    const fetchInvoices = async () => {
        try {
            const { data } = await api.get('/api/invoices')
            // Client-side API returns only their own invoices
            setInvoices(data)
        } catch (err) { toast.error('Failed to fetch invoices') }
        finally { setLoading(false) }
    }

    const handleDownload = async (id, filename) => {
        const tId = toast.loading('Preparing download...');
        console.log('--- Starting Secure Download ---');
        try {
            // Using axios 'api' ensures Bearer token is in HEADERS
            // Cache-buster prevents any browser/proxy caching
            const response = await api.get(`/api/invoices/${id}/download?_cb=${Date.now()}`, {
                responseType: 'blob',
                timeout: 30000
            });

            if (response.data.type === 'application/json') {
                // We got an error message instead of a PDF blob
                const text = await response.data.text();
                const error = JSON.parse(text);
                throw new Error(error.message || 'Server error');
            }

            // Data is now in memory - IDM CANNOT intercept this the normal way
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.style.display = 'none';
            link.download = (filename || 'invoice') + '.pdf';
            
            document.body.appendChild(link);
            link.click();
            
            // Wait slightly before cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }, 100);

            toast.success('Download complete', { id: tId });
        } catch (err) {
            console.error('Secure Download Error:', err);
            toast.error(err.message || 'Download failed. Please refresh.', { id: tId });
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My Invoices</h1>
                <p className="text-gray-500 text-sm mt-1">View and download your billing documents</p>
            </div>

            <div className="glass-card overflow-hidden bg-white border border-gray-100 shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            {['Invoice ID', 'Order #', 'Date', 'Total Amount', 'Status', 'Action'].map(h => (
                                <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center"><div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                        ) : invoices.length > 0 ? invoices.map(inv => (
                            <tr key={inv._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-gray-800">{inv.invoiceId}</td>
                                <td className="px-6 py-4 text-sm text-red-600 font-mono font-medium">{inv.orderNumber}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(inv.createdAt)}</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-800">₹{inv.total?.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`status-badge border ${inv.status === 'Paid' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <button onClick={() => handleDownload(inv._id, inv.invoiceId)} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                        <HiOutlineDownload className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <HiOutlineClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-medium">No invoices available yet</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Invoices
