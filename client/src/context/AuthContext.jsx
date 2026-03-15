import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem('user')
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                setUser(parsed)
                api.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`
            } catch (e) {
                localStorage.removeItem('user')
            }
        }
        setLoading(false)
    }, [])

    const login = async (email, password) => {
        const { data } = await api.post('/api/auth/login', { email, password })
        const userWithToken = { ...data.user, token: data.token }
        localStorage.setItem('user', JSON.stringify(userWithToken))
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        setUser(userWithToken)
        return userWithToken
    }

    const register = async (formData) => {
        const { data } = await api.post('/api/auth/register', formData)
        const userWithToken = { ...data.user, token: data.token }
        localStorage.setItem('user', JSON.stringify(userWithToken))
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        setUser(userWithToken)
        return userWithToken
    }

    const logout = () => {
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
        setUser(null)
    }

    const updateUser = (updatedData) => {
        const updated = { ...user, ...updatedData }
        localStorage.setItem('user', JSON.stringify(updated))
        setUser(updated)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
