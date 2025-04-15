'use client'

import dynamic from 'next/dynamic'

const LoginPage = dynamic(() => import('@/components/auth/login_form'), {
    ssr: false,
})

export default function Login() {
    return <LoginPage />
}