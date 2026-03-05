import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: LucideIcon;
    iconColor?: string;
}

export function StatCard({ label, value, change, changeType = "neutral", icon: Icon, iconColor }: StatCardProps) {
    return (
        <div className="stat-card animate-slide-in">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="metric-label">{label}</p>
                    <p className="metric-value">{value}</p>
                    {change && (
                        <p
                            className={cn(
                                "text-xs font-medium",
                                changeType === "positive" && "status-success",
                                changeType === "negative" && "status-danger",
                                changeType === "neutral" && "text-muted-foreground"
                            )}
                        >
                            {change}
                        </p>
                    )}
                </div>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconColor || "bg-primary/10 text-primary")}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
