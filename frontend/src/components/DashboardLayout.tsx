import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GetAppButton } from "@/components/GetAppButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="flex items-center justify-between gap-4 border-b px-4 pt-[calc(var(--sat)+8px)] pb-2 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
                        <SidebarTrigger className="md:hidden" />
                        <div className="flex-1" />
                        <GetAppButton />
                        <ThemeToggle />
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
                        </Button>
                        <UserButton />
                    </header>
                    <main className="flex-1 px-4 md:px-6 overflow-auto mt-4 mb-[calc(var(--sab)+12px)]">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
}
