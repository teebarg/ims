import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2 } from "lucide-react";
import { StatusLabels, StatusType } from "@/types/customer";

const DeliveryBadge = ({ status = "PROCESSING" }: { status: StatusType }) => {
    const styles: Record<StatusType, string> = {
        PROCESSING: "bg-muted text-muted-foreground",
        OUT_FOR_DELIVERY: "bg-warning/15 text-warning-foreground dark:text-warning dark:border-warning/50",
        DELIVERED: "bg-success/15 text-success border-success/30 dark:border-success/50",
    };
    return (
        <Badge variant="outline" className={`text-xs font-normal ${styles[status]}`}>
            {status === "PROCESSING" && <Package className="h-3 w-3 mr-1" />}
            {status === "OUT_FOR_DELIVERY" && <Truck className="h-3 w-3 mr-1" />}
            {status === "DELIVERED" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {StatusLabels[status]}
        </Badge>
    );
};

export default DeliveryBadge;
