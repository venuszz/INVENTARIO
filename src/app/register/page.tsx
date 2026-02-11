"use client"

import { useTheme } from '@/context/ThemeContext';
import RegisterForm from '@/components/auth/register';

export default function RegisterPage() {
    const { isDarkMode } = useTheme();

    return <RegisterForm />;
}