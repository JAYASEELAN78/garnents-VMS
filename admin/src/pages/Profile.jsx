import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const [infoForm, setInfoForm] = useState({ name: user?.name || 'Admin', email: user?.email || 'admin@vms.com', phone: user?.phone || '+91 9876543210' });
    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleInfoSubmit = (e) => {
        e.preventDefault();
        toast.success("Profile updated successfully!");
    };

    const handlePassSubmit = (e) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirmPassword) return toast.error("Passwords do not match!");
        toast.success("Password changed successfully!");
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Update Information" />
                    <CardContent>
                        <form onSubmit={handleInfoSubmit} className="space-y-4">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex flex-col items-center justify-center font-bold text-2xl border-4 border-white shadow">
                                    {infoForm.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={infoForm.name} onChange={e => setInfoForm({ ...infoForm, name: e.target.value })} className="input-field pl-9" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                                <input type="email" value={infoForm.email} onChange={e => setInfoForm({ ...infoForm, email: e.target.value })} className="input-field" disabled title="Email cannot be changed easily" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                                <input type="text" value={infoForm.phone} onChange={e => setInfoForm({ ...infoForm, phone: e.target.value })} className="input-field" />
                            </div>
                            <button type="submit" className="w-full btn-primary mt-2">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Change Password" />
                    <CardContent>
                        <form onSubmit={handlePassSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Current Password</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="password" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} className="input-field pl-9" required />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm text-gray-600 mb-1">New Password</label>
                                <input type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
                                <input type="password" value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} className="input-field" required />
                            </div>
                            <button type="submit" className="w-full btn-secondary mt-2">
                                Update Password
                            </button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
export default ProfilePage;
