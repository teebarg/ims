import { Construction, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaintenancePageProps {
    message?: string;
}

const MaintenancePage = ({
    message = "We're performing scheduled maintenance. Please check back soon.",
}: MaintenancePageProps) => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-lg animate-slide-up">
                <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse-glow" />
                        <span className="font-mono text-xs text-muted-foreground tracking-wider uppercase">
                            Maintenance Mode
                        </span>
                    </div>
                    <Construction className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10">
                        <Construction className="h-10 w-10 text-amber-500" />
                    </div>

                    <div className="text-center">
                        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                            We'll be back soon
                        </h1>
                        <p className="mb-8 text-muted-foreground leading-relaxed">{message}</p>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-12 font-medium border-border hover:bg-secondary hover:text-foreground"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check again
                    </Button>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground font-mono">
                    {import.meta.env.VITE_APP_NAME || "Revoque IMS"} · Maintenance
                </p>
            </div>
        </div>
    );
};

export default MaintenancePage;
