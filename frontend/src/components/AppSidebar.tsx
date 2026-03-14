import { LayoutDashboard, Package, ShoppingCart, BarChart3, Users, ChevronLeft, Store, Tag } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUser } from "@clerk/react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "super-admin"] },
    { title: "Sales", url: "/sales", icon: ShoppingCart, roles: ["admin", "super-admin"] },
    { title: "Bales", url: "/bales", icon: Package, roles: ["super-admin"] },
    { title: "Customers", url: "/customers", icon: Users, roles: ["super-admin", "admin"] },
    { title: "Categories", url: "/categories", icon: Tag, roles: ["super-admin", "admin"] },
    { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ["super-admin"] },
];

export function AppSidebar() {
    const { state, toggleSidebar } = useSidebar();
    const collapsed = state === "collapsed";
    const location = useLocation();
    const { user } = useUser();

    const role = user?.publicMetadata?.role as string | undefined;
    const filteredItems = mainItems.filter((item) => item.roles.includes(role || ""));

    const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-4 safe-top h-[calc(56px+env(safe-area-inset-top))]">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                        <Store className="h-5 w-5 text-sidebar-primary-foreground" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-heading text-sm font-bold text-sidebar-foreground">IMS</span>
                            <span className="text-xs text-sidebar-muted">Inventory Manager</span>
                        </div>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">{!collapsed && "Menu"}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                                        <NavLink
                                            to={item.url}
                                            end={item.url === "/"}
                                            className="transition-colors"
                                            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-3">
                <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center rounded-md p-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                    <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                </button>
            </SidebarFooter>
        </Sidebar>
    );
}
