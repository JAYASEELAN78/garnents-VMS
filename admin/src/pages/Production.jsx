import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Activity, Play, CheckCircle, Eye, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProductionPage = () => {
    const [productions, setProductions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduction = async () => {
            try {
                const { data } = await api.get('/api/production');
                setProductions(data);
            } catch (error) {
                toast.error('Failed to load production records');
            } finally {
                setLoading(false);
            }
        };
        fetchProduction();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/api/production/${id}`, { status });
            setProductions(prev => prev.map(p => p._id === id ? { ...p, status } : p));
            toast.success(`Production marked as ${status}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this production record?')) return;
        try {
            await api.delete(`/api/production/${id}`);
            setProductions(prev => prev.filter(p => p._id !== id));
            toast.success('Record deleted.');
        } catch {
            toast.error('Failed to delete.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-800">Production Tracking</h1>
            </div>

            <Card>
                <CardHeader title="Active Production Lines" subtitle="Track manufacturing progress" />
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading tracking data...</div>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableHeader>Prod ID</TableHeader>
                                <TableHeader>Ref Order</TableHeader>
                                <TableHeader>Client</TableHeader>
                                <TableHeader>Assigned Staff</TableHeader>
                                <TableHeader>Start Date</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </TableHead>
                            <TableBody>
                                {productions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan="6" className="text-center text-gray-500 py-8">
                                            No active production found.
                                        </TableCell>
                                    </TableRow>
                                ) : productions.map((prod) => (
                                    <TableRow key={prod._id}>
                                        <TableCell className="font-medium text-gray-900">{prod.production_id}</TableCell>
                                        <TableCell className="text-blue-600">
                                            {prod.order_id?.order_id || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900">
                                                {prod.order_id?.company_id?.name || prod.order_id?.user_id?.name || 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{prod.assigned_staff || 'Unassigned'}</TableCell>
                                        <TableCell>
                                            {prod.start_date ? new Date(prod.start_date).toLocaleDateString() : 'Pending'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${prod.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                prod.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {prod.status || 'Pending'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                {prod.status !== 'In Progress' && prod.status !== 'Completed' && (
                                                    <button onClick={() => handleUpdateStatus(prod._id, 'In Progress')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Start Production">
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {prod.status === 'In Progress' && (
                                                    <button onClick={() => handleUpdateStatus(prod._id, 'Completed')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Complete Production">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button title="View Details" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(prod._id)} title="Delete Record" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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

export default ProductionPage;
