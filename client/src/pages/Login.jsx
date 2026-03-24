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
    const { login } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password) return toast.error('Please fill all fields')
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
            toast.error(err.response?.data?.message || 'Login failed')
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
                        <img src="/assets/logo.png" alt="VMS Logo" className="w-full h-full object-contain filter brightness-0 invert" />
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

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-12" placeholder="you@company.com" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-12 pr-12" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign In'}
                        </button>
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
