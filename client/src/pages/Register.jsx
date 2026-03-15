import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone, HiOutlineOfficeBuilding, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'

const Register = () => {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '', phone: '',
        companyName: '', gstNumber: '', companyAddress: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name || !form.email || !form.password || !form.confirmPassword) return toast.error('Please fill all required fields')
        if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters')

        setLoading(true)
        try {
            const user = await register({
                name: form.name,
                email: form.email,
                password: form.password,
                phone: form.phone,
                companyName: form.companyName,
                gstNumber: form.gstNumber,
                companyAddress: form.companyAddress
            })
            toast.success('Account created successfully!')

            // Redirect admins to the Admin Panel
            if (user?.role === 'admin') {
                const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'
                window.location.href = adminUrl
                return
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const fields = [
        { name: 'name', label: 'Full Name', type: 'text', icon: HiOutlineUser, placeholder: 'John Doe', required: true },
        { name: 'email', label: 'Email Address', type: 'email', icon: HiOutlineMail, placeholder: 'you@company.com', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', icon: HiOutlinePhone, placeholder: '+91 98765 43210' },
        { name: 'companyName', label: 'Company Name', type: 'text', icon: HiOutlineOfficeBuilding, placeholder: 'Company Ltd' },
        { name: 'gstNumber', label: 'GST Number', type: 'text', icon: HiOutlineOfficeBuilding, placeholder: '22AAAAA0000A1Z5' },
        { name: 'companyAddress', label: 'Company Address', type: 'text', icon: HiOutlineOfficeBuilding, placeholder: '123 Business St' },
    ]

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-red-700 via-red-600 to-red-800 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-32 left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-32 right-16 w-72 h-72 bg-red-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>
                <div className="relative z-10 flex flex-col justify-center px-14">
                    <div className="w-24 h-24 mb-8">
                        <img src="/assets/logo.png" alt="VMS Logo" className="w-full h-full object-contain filter brightness-0 invert" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Join V.M.S GRAMENTS</h1>
                    <p className="text-lg text-red-100 mb-8">Start managing your orders like a pro</p>
                    <div className="space-y-4">
                        {['Real-time order tracking', 'Instant invoice downloads', 'Direct communication with admin', 'Secure document uploads'].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.2}s` }}>
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <span className="text-red-50 text-sm">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-lg">
                    <div className="lg:hidden mb-8 text-center text-center flex justify-center">
                        <div className="w-20 h-20 mb-4">
                            <img src="/assets/logo.png" alt="VMS Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
                    <p className="text-gray-500 mb-8">Fill in your details to get started</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {fields.map((field) => (
                                <div key={field.name} className={field.name === 'companyAddress' ? 'sm:col-span-2' : ''}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="relative">
                                        <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                                        <input type={field.type} name={field.name} value={form[field.name]} onChange={handleChange}
                                            className="input-field pl-11 py-2.5 text-sm" placeholder={field.placeholder} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                                        className="input-field pl-11 pr-11 py-2.5 text-sm" placeholder="Min. 6 characters" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                                    <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                                        className="input-field pl-11 pr-11 py-2.5 text-sm" placeholder="Repeat password" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <HiOutlineEyeOff className="w-4.5 h-4.5" /> : <HiOutlineEye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-red-600 hover:text-red-500 font-semibold">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register
