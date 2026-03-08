import { ShieldX, Mail, Phone, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const AccessDeniedPage = () => {
    return (
        <div className="flex min-h-screenp items-center justify-center bg-background p-4">
            {/* Ambient glow effect */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-lg animate-slide-up">
                {/* Top status bar */}
                <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse-glow" />
                        <span className="font-mono text-xs text-muted-foreground tracking-wider uppercase">Access Restricted</span>
                    </div>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Main card */}
                <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
                    {/* Icon */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 pos-glow">
                        <ShieldX className="h-10 w-10 text-destructive" />
                    </div>

                    {/* Content */}
                    <div className="text-center">
                        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">No Access Granted</h1>
                        <p className="mb-8 text-muted-foreground leading-relaxed">
                            Your account doesn't have permission. Please contact your system administrator to request access.
                        </p>
                    </div>

                    {/* Action cards */}
                    <div className="space-y-3">
                        <a
                            href="mailto:admin@company.com"
                            className="group flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:border-primary/30 hover:bg-secondary"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">Email Admin</p>
                                <p className="text-xs text-muted-foreground truncate">admin@company.com</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        </a>

                        <a
                            href="tel:+1234567890"
                            className="group flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:border-primary/30 hover:bg-secondary"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">Call Support</p>
                                <p className="text-xs text-muted-foreground">+234 (800) 123 4567</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        </a>
                    </div>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground font-mono">OR</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Sign out */}
                    <Button variant="outline" className="w-full h-12 font-medium border-border hover:bg-secondary hover:text-foreground">
                        Sign out & use another account
                    </Button>
                </div>

                {/* Footer */}
                <p className="mt-4 text-center text-xs text-muted-foreground font-mono">Revoque IMS · v1.0.0</p>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
