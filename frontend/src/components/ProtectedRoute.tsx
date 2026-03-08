import { Loader2 } from "lucide-react";
import { RedirectToSignIn, useUser } from "@clerk/react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useUser();

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

    return <>{children}</>;
}
