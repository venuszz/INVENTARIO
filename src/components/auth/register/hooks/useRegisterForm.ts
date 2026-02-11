import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/app/lib/supabase/client';
import { RegisterFormData } from '../types';

export function useRegisterForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<RegisterFormData>({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        confirmPassword: '',
        rol: 'usuario'
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const updateField = (field: keyof RegisterFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validatePersonalData = () => {
        if (!formData.firstName.trim()) {
            setError('Por favor, ingresa tu nombre');
            return false;
        }
        if (!formData.lastName.trim()) {
            setError('Por favor, ingresa tu apellido');
            return false;
        }
        return true;
    };

    const validateCredentials = () => {
        if (!formData.username.trim()) {
            setError('Por favor, ingresa un nombre de usuario');
            return false;
        }
        if (formData.username.length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres');
            return false;
        }
        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        setError(null);
        if (validatePersonalData()) {
            setStep(2);
        }
    };

    const handlePrevStep = () => {
        setError(null);
        setStep(1);
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (isLoading) return;
        if (!validateCredentials()) return;

        setIsLoading(true);

        try {
            const sanitizedUsername = formData.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const uniqueEmail = `${sanitizedUsername}@inventario.com`;

            const { data: usernameExists, error: checkError } = await supabase
                .rpc('check_username_exists', { p_username: formData.username });

            if (checkError) {
                setError('Ocurrió un error al verificar disponibilidad. Intenta de nuevo.');
                setIsLoading(false);
                return;
            }

            if (usernameExists) {
                setError('Este nombre de usuario ya está en uso. Por favor, elige otro.');
                setIsLoading(false);
                return;
            }

            const { data: emailExists, error: emailCheckError } = await supabase
                .rpc('check_email_exists', { p_email: uniqueEmail });

            if (emailCheckError) {
                setError('Ocurrió un error al verificar disponibilidad. Intenta de nuevo.');
                setIsLoading(false);
                return;
            }

            if (emailExists) {
                setError('Este usuario ya está registrado. Por favor, elige otro nombre de usuario.');
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: uniqueEmail,
                password: formData.password,
                options: {
                    data: {
                        username: formData.username,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        rol: formData.rol
                    },
                    emailRedirectTo: undefined,
                }
            });

            if (error) {
                setError(error.message);
                setIsLoading(false);
                return;
            }

            if (data.user) {
                const { error: userError } = await supabase
                    .from('users')
                    .insert({
                        id: data.user.id,
                        username: formData.username,
                        email: uniqueEmail,
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        rol: formData.rol,
                        oauth_provider: 'traditional',
                        oauth_user_id: null,
                        is_active: false,
                        pending_approval: true,
                    });

                if (userError) {
                    setError(userError.message);
                    setIsLoading(false);
                    return;
                }

                try {
                    await supabase.functions.invoke('confirm-user', {
                        body: { user_id: data.user.id }
                    });
                } catch {
                    // Ignorar error de confirmación si falla
                }
            }

            setRegistrationSuccess(true);
            
            setTimeout(() => {
                // Guardar el userId en localStorage para monitoreo
                if (data.user) {
                    localStorage.setItem('pending_user_id', data.user.id);
                }
                router.push('/login?awaiting_approval=true');
            }, 2000);
        } catch {
            setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        step,
        formData,
        error,
        isLoading,
        showPassword,
        showConfirmPassword,
        registrationSuccess,
        setShowPassword,
        setShowConfirmPassword,
        updateField,
        handleNextStep,
        handlePrevStep,
        handleRegister
    };
}
