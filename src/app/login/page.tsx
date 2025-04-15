'use client'

// app/login/page.tsx
import dynamic from 'next/dynamic'

// Importación dinámica del componente de cliente para evitar errores de hidratación
const LoginPage = dynamic(() => import('@/components/auth/login_form'), {
    ssr: false, // Desactivar renderizado en servidor para componentes que usan hooks de navegador
})

export default function Login() {
    return <LoginPage />
}