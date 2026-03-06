import { Loader2 } from "lucide-react";
import { useAuth, RedirectToSignIn, useUser } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";

// export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
//     const { isLoaded, isSignedIn } = useAuth();

//     if (!isLoaded) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-background">
//                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
//             </div>
//         );
//     }

//     if (!isSignedIn) {
//         return <RedirectToSignIn />;
//     }

//     return <>{children}</>;
// }

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, user, ...rest } = useUser();
    console.log("🚀 ~ file: ProtectedRoute.tsx:25 ~ isSignedIn:", isSignedIn)
    console.log("🚀 ~ file: ProtectedRoute.tsx:25 ~ isLoaded:", isLoaded)
    console.log("🚀 ~ file: ProtectedRoute.tsx:25 ~ rest:", rest);
    const auth = useAuth();
    console.log("🚀 ~ file: ProtectedRoute.tsx:26 ~ auth:", auth);
    console.log("🚀 ~ file: ProtectedRoute.tsx:25 ~ user:", user);
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
    const isAdmin = role === "admin" || role === "super-admin";

    if (!isAdmin && location.pathname !== "/no-access") {
        return <Navigate to="/no-access" replace />;
    }

    return <>{children}</>;
}
