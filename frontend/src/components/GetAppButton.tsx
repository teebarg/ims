import { Download } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
    interface Window {
        deferredPrompt?: BeforeInstallPromptEvent | null;
    }
}

export const GetAppButton = () => {
    const [installable, setInstallable] = useState(false);

    useEffect(() => {
        if (window.deferredPrompt) {
            setInstallable(true);
        }

        const handler = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            window.deferredPrompt = e;
            setInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handler as EventListener);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler as EventListener);
        };
    }, []);

    useEffect(() => {
        const installedHandler = () => {
            console.log("PWA installed");
            setInstallable(false);
            window.deferredPrompt = null;
        };

        window.addEventListener("appinstalled", installedHandler);

        return () => window.removeEventListener("appinstalled", installedHandler);
    }, []);

    const handleInstallClick = async () => {
        const promptEvent = window.deferredPrompt;
        if (!promptEvent) return;

        promptEvent.prompt();

        const { outcome } = await promptEvent.userChoice;

        if (outcome === "accepted") {
            window.deferredPrompt = null;
            setInstallable(false);
        }
    };

    if (!installable) return null;

    return (
        <button onClick={handleInstallClick} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white">
            <Download size={16} />
            Get App
        </button>
    );
};

// import { useState, useEffect } from "react";

// export const GetAppButton = () => {
//     const [installable, setInstallable] = useState(false);
//     console.log("🚀 ~ GetAppButton ~ installable:", installable)

//     useEffect(() => {
//         // 1. Check if the event was already captured in main.tsx
//         if (window.deferredPrompt) {
//             console.log("Found saved prompt in window");
//             setInstallable(true);
//         }

//         // 2. Also listen for the event in case it fires AFTER this component mounts
//         const handler = (e: any) => {
//             e.preventDefault();
//             window.deferredPrompt = e;
//             setInstallable(true);
//         };

//         window.addEventListener("beforeinstallprompt", handler);
//         return () => window.removeEventListener("beforeinstallprompt", handler);
//     }, []);

//     const handleInstallClick = async () => {
//         const promptEvent = window.deferredPrompt;
//         if (!promptEvent) {
//             console.error("No prompt event found");
//             return;
//         }

//         // Show the native prompt
//         promptEvent.prompt();

//         // Wait for user choice
//         const { outcome } = await promptEvent.userChoice;
//         console.log(`User response: ${outcome}`);

//         if (outcome === "accepted") {
//             window.deferredPrompt = null;
//             setInstallable(false);
//         }
//     };

//     if (!installable) return null;

//     return <button onClick={handleInstallClick}>Install App</button>;
// };
