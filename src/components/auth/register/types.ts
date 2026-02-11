export interface RegisterFormData {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    confirmPassword: string;
    rol: string;
}

export interface RegisterStep {
    step: number;
    setStep: (step: number) => void;
}
