"use client"

import { useTheme } from '@/context/ThemeContext';
import RegisterForm from '@/components/auth/register';

export default function RegisterPage() {
    return (
        <div className="fixed inset-0 overflow-y-auto">
            <RegisterForm />
        </div>
    );
}