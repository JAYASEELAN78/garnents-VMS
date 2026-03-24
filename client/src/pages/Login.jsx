import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'

const Login = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const { login } = useAuth()

    const validateForm = () => {
        const newErrors = {}
        if (!email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        if (!password) {
            newErrors.password = 'Password is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return
        
        setLoading(true)
        try {
            const user = await login(email, password)
            toast.success('Welcome back!')

            // Redirect admins to the Admin Panel
            if (user?.role === 'admin') {
                const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'
                window.location.href = adminUrl
                return
            }

            navigate('/dashboard')
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed'
            if (message.toLowerCase().includes('email')) {
                setErrors({ email: message })
            } else if (message.toLowerCase().includes('password')) {
                setErrors({ password: message })
            } else {
                toast.error(message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-red-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
                </div>
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="w-20 h-20 mb-8">
                        <img src="/assets/logo.png" alt="VMS Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">V.M.S GARMENTS</h1>
                    <p className="text-xl text-red-100 mb-8">Order Management System</p>
                    <div className="space-y-4">
                        {['Track orders in real-time', 'Upload design files', 'Download invoices instantly'].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <span className="text-red-50">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-10 text-center">
                        <div className="w-20 h-20 mx-auto mb-4">
                            <img src="/assets/logo.png" alt="VMS Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">V.M.S GARMENTS</h1>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h2>
                    <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.email ? 'text-red-500' : 'text-gray-400'}`} />
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (errors.email) setErrors({ ...errors, email: '' })
                                    }}
                                    className={`input-field pl-12 transition-all ${
                                        errors.email 
                                        ? 'border-red-300 focus:border-red-500 ring-1 ring-red-100 bg-red-50/20' 
                                        : 'focus:border-red-600'
                                    }`} 
                                    placeholder="you@company.com" 
                                />
                            </div>
                            {errors.email && <p className="mt-1.5 text-xs text-red-600 font-medium ml-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-500' : 'text-gray-400'}`} />
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    value={password} 
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        if (errors.password) setErrors({ ...errors, password: '' })
                                    }}
                                    className={`input-field pl-12 pr-12 transition-all ${
                                        errors.password 
                                        ? 'border-red-300 focus:border-red-500 ring-1 ring-red-100 bg-red-50/20' 
                                        : 'focus:border-red-600'
                                    }`} 
                                    placeholder="••••••••" 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-xs text-red-600 font-medium ml-1">{errors.password}</p>}
                        </div>
                        <div className="pt-2">
                            <button type="submit" disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Signing In...</span>
                                    </div>
                                ) : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-gray-500">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="text-red-600 hover:text-red-500 font-semibold">Create Account</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
