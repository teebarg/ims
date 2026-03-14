import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/react";

export default function RoleProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
    const { user } = useUser();
    const location = useLocation();

    const role = user?.publicMetadata?.role as string | undefined;

    // admin always allowed
    if (role === "admin") {
        return <>{children}</>;
    }

    if (!allowedRoles.includes(role || "")) {
        return <Navigate to="/no-access" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
