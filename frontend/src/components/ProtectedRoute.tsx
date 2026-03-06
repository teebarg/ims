import { Loader2 } from "lucide-react";
import { RedirectToSignIn, useUser } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, user } = useUser();
    const location = useLocation();

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isSignedIn) {
        return <RedirectToSignIn />;
    }

    const role = user?.publicMetadata?.role as string | undefined;
    const isAllowedRole = ["admin", "super-admin"].includes(role || "");

    if (!isAllowedRole && location.pathname !== "/no-access") {
        return <Navigate to="/no-access" replace />;
    }

    return <>{children}</>;
}
