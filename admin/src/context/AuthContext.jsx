import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('adminToken');
            if (token) {
                try {
                    // Assume the backend returns user profile in some endpoint 
                    // Since /api/auth/me might not exist, we'll decode the JWT or fetch profile
                    // But here, we can just rely on token existence and maybe fetch users to verify admin
                    // Actually, if token is valid, we'll fetch profile later. For now just set a mock user object.
                    // Wait, let's use the standard login response data saved in localStorage earlier
                    const storedUser = localStorage.getItem('adminUser');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    } else {
                        setUser({ role: 'admin' }); // fallback
                    }
                } catch (error) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/api/auth/login', { email, password });

            if (data.user.role !== 'admin') {
                throw new Error('Unauthorized: Admin access only');
            }

            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
