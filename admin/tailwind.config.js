/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
                accent: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
                surface: { 50: '#ffffff', 100: '#f8f9fa', 200: '#f1f3f5', 300: '#e9ecef', 400: '#dee2e6', 500: '#adb5bd', 600: '#6c757d', 700: '#495057', 800: '#343a40', 900: '#212529' }
            },
            fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
            animation: { 'fade-in': 'fadeIn 0.5s ease-out', 'slide-up': 'slideUp 0.5s ease-out' },
            keyframes: {
                fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
                slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } }
            }
        },
    },
    plugins: [],
}
