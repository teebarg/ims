import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "./AppSidebar";

const setOpenMobileMock = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return {
        ...actual,
        useLocation: () => ({ pathname: "/sales" }),
    };
});

vi.mock("@clerk/react", () => ({
    useUser: () => ({
        user: {
            publicMetadata: { role: "admin" },
        },
    }),
}));

vi.mock("@/components/NavLink", () => ({
    NavLink: ({ children, to, onClick }: { children: React.ReactNode; to: string; onClick?: React.MouseEventHandler<HTMLAnchorElement> }) => (
        <a href={to} onClick={onClick}>
            {children}
        </a>
    ),
}));

vi.mock("@/components/ui/sidebar", () => ({
    Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSidebar: () => ({
        state: "expanded",
        toggleSidebar: vi.fn(),
        isMobile: true,
        openMobile: true,
        setOpenMobile: setOpenMobileMock,
    }),
}));

describe("AppSidebar", () => {
    beforeEach(() => {
        setOpenMobileMock.mockClear();
    });

    it("closes the mobile sidebar when a navigation link is clicked", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);

        act(() => {
            root.render(<AppSidebar />);
        });

        const dashboardLink = container.querySelector('a[href="/"]');
        expect(dashboardLink).not.toBeNull();

        act(() => {
            dashboardLink?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(setOpenMobileMock).toHaveBeenCalledWith(false);

        act(() => {
            root.unmount();
        });
        container.remove();
    });
});
