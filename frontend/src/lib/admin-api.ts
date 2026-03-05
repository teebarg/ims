import { useAuth } from "@clerk/clerk-react";

export interface AdminUser {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    role: "admin" | "staff";
    banned: boolean;
}

async function callAdminApi(action: string, method: string, body?: any) {
    const { getToken } = useAuth();
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`;
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

export const adminApi = {
    listUsers: (): Promise<AdminUser[]> => callAdminApi("list", "GET"),
    createUser: (email: string, role: string, password?: string) =>
        callAdminApi("create", "POST", { email, role, password: password || undefined }),
    updateRole: (userId: string, role: string) =>
        callAdminApi("update-role", "PUT", { userId, role }),
    toggleStatus: (userId: string, ban: boolean) =>
        callAdminApi("toggle-status", "PUT", { userId, ban }),
    deleteUser: (userId: string) =>
        callAdminApi("delete", "DELETE", { userId }),
};
