import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ClerkProvider } from "@clerk/react";
import { ThemeProvider } from "@/components/theme-provider";

const rootElement = document.getElementById("root") as HTMLElement;

const AppWrapper = () => {
    const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!PUBLISHABLE_KEY) throw new Error("Add your Clerk Publishable Key");

    window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        (window as any).deferredPrompt = e;
    });

    return (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <ThemeProvider defaultTheme="system" enableSystem>
                <App />
            </ThemeProvider>
        </ClerkProvider>
    );
};

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <AppWrapper />
    </React.StrictMode>
);
