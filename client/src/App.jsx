import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import ClientRoutes from './routes/ClientRoutes'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
    const { user } = useAuth()

    // Immediately redirect any logged-in admins to the admin portal
    if (user?.role === 'admin') {
        window.location.href = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'
        return null
    }

    return (
        <>
            <Toaster position="top-right" toastOptions={{
                style: { background: '#fff', color: '#1f2937', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
                success: { iconTheme: { primary: '#dc2626', secondary: '#fff' } }
            }} />
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
                <Route path="/*" element={user ? <ClientRoutes /> : <Navigate to="/login" />} />
            </Routes>
        </>
    )
}

export default App
