import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export function useUserRole() {
    const [role, setRole] = useState<string | undefined>();
    useEffect(() => {
        const userDataCookie = Cookies.get("userData");
        if (userDataCookie) {
            try {
                const parsed = JSON.parse(userDataCookie);
                setRole(parsed.rol);
            } catch {
                setRole(undefined);
            }
        }
    }, []);
    return role;
}
