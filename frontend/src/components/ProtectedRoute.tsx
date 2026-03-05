import { Loader2 } from "lucide-react";
import { useAuth, RedirectToSignIn } from "@clerk/react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
    // return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
