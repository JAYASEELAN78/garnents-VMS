import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineOfficeBuilding, HiOutlineSave } from 'react-icons/hi'

const Profile = () => {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '', email: '', phone: '',
        companyName: '', companyAddress: '', gstNumber: ''
    })

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                companyName: user.company?.name || '',
                companyAddress: user.company?.address || '',
                gstNumber: user.company?.gstNumber || ''
            })
        }
    }, [user])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.put('/api/auth/profile', form)
            updateUser(data)
            toast.success('Profile updated!')
        } catch (err) { toast.error('Update failed') }
        finally { setLoading(false) }
    }

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your account and company details</p>
            </div>

            {/* Profile Card */}
            <div className="glass-card p-8 mb-6">
                <div className="flex items-center gap-5 mb-8 pb-6 border-b border-gray-100">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-red-200">
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
                        <p className="text-gray-500">{user?.email}</p>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-600 rounded-full">Client</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[
                            { name: 'name', label: 'Full Name', icon: HiOutlineUser },
                            { name: 'email', label: 'Email', icon: HiOutlineMail, type: 'email' },
                            { name: 'phone', label: 'Phone', icon: HiOutlinePhone },
                            { name: 'companyName', label: 'Company Name', icon: HiOutlineOfficeBuilding },
                            { name: 'gstNumber', label: 'GST Number', icon: HiOutlineOfficeBuilding },
                        ].map((field) => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-600 mb-2">{field.label}</label>
                                <div className="relative">
                                    <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                                    <input type={field.type || 'text'} name={field.name} value={form[field.name]} onChange={handleChange} className="input-field pl-11" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Company Address</label>
                        <textarea name="companyAddress" value={form.companyAddress} onChange={handleChange} rows="2" className="input-field resize-none" />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><HiOutlineSave className="w-5 h-5" /> Save Changes</>}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Profile
