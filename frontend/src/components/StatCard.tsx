import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: LucideIcon;
    iconColor?: string;
    valueColor?: string;
}

export function StatCard({ label, value, change, changeType = "neutral", icon: Icon, iconColor, valueColor }: StatCardProps) {
    return (
        <div className="bg-card rounded-xl border p-5 transition-shadow hover:shadow-md animate-slide-in">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">{label}</p>
                    <p className={cn("text-xl md:text-3xl font-bold", valueColor)}>{value}</p>
                    {change && (
                        <p
                            className={cn(
                                "text-xs font-medium",
                                changeType === "positive" && "text-success",
                                changeType === "negative" && "text-destructive",
                                changeType === "neutral" && "text-muted-foreground"
                            )}
                        >
                            {change}
                        </p>
                    )}
                </div>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconColor || "bg-primary/10 text-primary")}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
}
