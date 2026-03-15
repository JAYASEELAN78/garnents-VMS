import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Users, Search, Plus, Mail, Phone, MapPin, Eye, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                // Fetch all users to ensure we don't miss those who haven't been upgraded to 'client' role yet
                const { data } = await api.get('/api/users?limit=100');
                // Handle nested response: { success, data: { users: [...] } }
                const usersArray = data?.data?.users || data?.users || (Array.isArray(data) ? data : []);
                // Filter out admins to show only customers/clients
                setClients(usersArray.filter(u => u.role !== 'admin'));
            } catch (error) {
                console.error('Failed to load clients', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
        const interval = setInterval(fetchClients, 10000); // auto-refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await api.delete(`/api/users/${id}`);
            setClients(prev => prev.filter(c => c._id !== id));
            toast.success('Client deleted successfully');
        } catch (err) {
            toast.error('Failed to delete client');
        }
    };

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" /> Clients Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage standard and premium client accounts.</p>
                </div>
                <button className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Client
                </button>
            </div>

            <Card>
                <CardHeader
                    title="All Clients"
                    subtitle={`${filteredClients.length} records found`}
                    action={
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                            />
                        </div>
                    }
                />
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading clients...</div>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableHeader>Client Info</TableHeader>
                                <TableHeader>Contact</TableHeader>
                                <TableHeader>Company Details</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </TableHead>
                            <TableBody>
                                {filteredClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan="5" className="text-center text-gray-500 py-8">
                                            No clients found matching your search.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredClients.map((client) => (
                                    <TableRow key={client._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{client.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {client._id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {client.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {client.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-medium text-gray-800">{client?.company?.name || <span className="text-gray-400 italic text-xs">No company</span>}</p>
                                                {client?.company?.gstNumber && (
                                                    <p className="text-xs text-gray-500">GST: {client.company.gstNumber}</p>
                                                )}
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <MapPin className="w-3 h-3" /> {client?.company?.address || '—'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${client.role === 'client'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {client.role}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${client.isActive !== false
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {client.isActive !== false ? '● Active' : '● Inactive'}
                                                </span>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    Joined {new Date(client.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    title="View Details"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Edit Client"
                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Delete Client"
                                                    onClick={() => handleDelete(client._id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
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

export default ClientsPage;
