import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { FileText, Download } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const { data } = await api.get('/api/invoices');
                setInvoices(data);
            } catch (error) {
                toast.error('Failed to load invoices');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const handleDownloadInvoice = async (id, invoiceId) => {
        try {
            const response = await api.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            // IDM interception aborts the fetch before a response is received.
            if (err.response) {
                toast.error('Failed to download PDF');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-800">Invoice Management</h1>
            </div>

            <Card>
                <CardHeader title="All Invoices" />
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading invoices...</div>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableHeader>Invoice ID</TableHeader>
                                <TableHeader>Order Ref</TableHeader>
                                <TableHeader>Client</TableHeader>
                                <TableHeader>Date</TableHeader>
                                <TableHeader>Total Amount</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Action</TableHeader>
                            </TableHead>
                            <TableBody>
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan="6" className="text-center text-gray-500 py-8">
                                            No invoices found.
                                        </TableCell>
                                    </TableRow>
                                ) : invoices.map((invoice) => (
                                    <TableRow key={invoice._id}>
                                        <TableCell className="font-semibold text-gray-900">{invoice.invoiceId}</TableCell>
                                        <TableCell className="text-blue-600">{invoice.orderNumber || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900">{invoice.clientName || 'Unknown'}</div>
                                        </TableCell>
                                        <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium text-gray-900">₹{invoice.total}</TableCell>
                                        <TableCell>
                                            <StatusBadge status="Paid" />
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={() => handleDownloadInvoice(invoice._id, invoice.invoiceId)}
                                                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                <Download className="w-4 h-4" /> PDF
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoicesPage;
