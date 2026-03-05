import { useState, useEffect } from "react";

export type PwaInstallState =
    | { status: "installed" }
    | { status: "unsupported" }
    | { status: "ios" }
    | { status: "android"; prompt: () => Promise<{ outcome: "accepted" | "dismissed" }> };

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIOS(): boolean {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function usePwaInstall(): PwaInstallState | null {
    const [state, setState] = useState<PwaInstallState | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (isStandalone()) {
            setState({ status: "installed" });
            return;
        }
        if (isIOS()) {
            setState({ status: "ios" });
            return;
        }
        let resolved = false;
        const handler = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            resolved = true;
            setState({
                status: "android",
                prompt: () => e.prompt().then((result) => result),
            });
        };
        window.addEventListener("beforeinstallprompt", handler);
        const timer = setTimeout(() => {
            if (!resolved) setState({ status: "unsupported" });
        }, 1500);
        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            clearTimeout(timer);
        };
    }, []);

    return state;
}

export { isStandalone, isIOS };
