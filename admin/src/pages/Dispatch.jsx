import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Truck } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DispatchPage = () => {
    const [dispatches, setDispatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDispatches = async () => {
            try {
                const { data } = await api.get('/api/dispatches');
                setDispatches(data);
            } catch (error) {
                toast.error('Failed to load dispatches');
            } finally {
                setLoading(false);
            }
        };
        fetchDispatches();
    }, []);

    const handleStatusChange = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Pending' ? 'In Transit' : 'Delivered';
        try {
            await api.put(`/api/dispatches/${id}`, { delivery_status: newStatus });
            setDispatches(prev => prev.map(d => d._id === id ? { ...d, delivery_status: newStatus } : d));
            toast.success(`Dispatch moved to ${newStatus}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-800">Dispatch Management</h1>
            </div>

            <Card>
                <CardHeader title="Current Dispatches" subtitle="Manage logistical movements" />
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading dispatches...</div>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableHeader>Dispatch ID</TableHeader>
                                <TableHeader>Order Ref</TableHeader>
                                <TableHeader>Client</TableHeader>
                                <TableHeader>Transport Info</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </TableHead>
                            <TableBody>
                                {dispatches.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan="5" className="text-center text-gray-500 py-8">
                                            No dispatch records found.
                                        </TableCell>
                                    </TableRow>
                                ) : dispatches.map((dispatch) => (
                                    <TableRow key={dispatch._id}>
                                        <TableCell>
                                            <p className="font-semibold text-gray-900">{dispatch.dispatch_id}</p>
                                            <p className="text-xs text-gray-500">LR: {dispatch.lr_number || 'N/A'}</p>
                                        </TableCell>
                                        <TableCell className="text-blue-600 font-medium">
                                            {dispatch.order_id?.order_id || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900">
                                                {dispatch.order_id?.company_id?.name || dispatch.order_id?.user_id?.name || 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {dispatch.transport || 'Unassigned Vehicle'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${dispatch.delivery_status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                dispatch.delivery_status === 'In Transit' ? 'bg-indigo-100 text-indigo-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {dispatch.delivery_status || 'Pending'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {dispatch.delivery_status !== 'Delivered' && (
                                                <button
                                                    onClick={() => handleStatusChange(dispatch._id, dispatch.delivery_status)}
                                                    className="text-xs font-medium text-blue-600 border border-blue-600 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                                                >
                                                    Advance Status
                                                </button>
                                            )}
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

export default DispatchPage;
