import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface OverlayProps {
    trigger?: React.ReactNode;
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string | React.ReactNode;
    drawerClassName?: string;
    sheetClassName?: string;
    showHeader?: boolean;
    side?: "top" | "right" | "bottom" | "left";
}

const SheetDrawer: React.FC<OverlayProps> = ({
    trigger,
    children,
    open,
    onOpenChange,
    title = "Header Content",
    sheetClassName = "",
    drawerClassName = "",
    showHeader = true,
    side = "right",
}) => {
    const isMobile = useIsMobile();
    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
                <DrawerContent aria-describedby={undefined} className={cn("data-[vaul-drawer-direction=bottom]:max-h-[95vh]", drawerClassName)}>
                    <DrawerHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                    </DrawerHeader>
                    <div className="safe-bottom">{children}</div>
                </DrawerContent>
            </Drawer>
        );
    }
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
            <SheetContent
                aria-describedby={undefined}
                side={side}
                className={cn("w-full sm:max-w-lg px-0 py-2 flex flex-col bg-card border-border", sheetClassName)}
            >
                <SheetHeader className={showHeader ? "px-4 mt-1" : "sr-only"}>
                    <SheetTitle className="flex items-center gap-3 text-xl">{title}</SheetTitle>
                </SheetHeader>
                <div className="safe-bottom">{children}</div>
            </SheetContent>
        </Sheet>
    );
};

export default SheetDrawer;
