import { useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function GetAppButton() {
    const installState = usePwaInstall();
    const [iosDrawerOpen, setIosDrawerOpen] = useState(false);

    if (!installState || installState.status === "installed") {
        return null;
    }

    if (installState.status === "unsupported") {
        const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
        const isDesktopChrome = /Chrome/.test(ua) && !/Mobile/.test(ua) && !/Edg/.test(ua);
        if (isDesktopChrome) {
            return (
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full font-medium"
                    onClick={() =>
                        alert('This app can be installed – click the install icon in the address bar (or press Ctrl+Shift+I) and select "Install".')
                    }
                >
                    <Download className="h-4 w-4" />
                    Install
                </Button>
            );
        }
        return null;
    }

    if (installState.status === "android") {
        return (
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full font-medium" onClick={() => installState.prompt()}>
                <Download className="h-4 w-4" />
                Get App
            </Button>
        );
    }

    // iOS: show button that opens drawer with Add to Home Screen instructions
    return (
        <Drawer open={iosDrawerOpen} onOpenChange={setIosDrawerOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-full font-medium">
                    <Download className="h-4 w-4" />
                    Get App
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]" aria-describedby={undefined}>
                <DrawerHeader>
                    <DrawerTitle>Add to Home Screen</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-8 pt-2 text-sm text-muted-foreground space-y-6">
                    <p>Install this app on your iPhone or iPad for quick access:</p>
                    <ol className="list-decimal list-inside space-y-3">
                        <li>
                            Tap the <Share className="inline h-4 w-4 mx-0.5 align-middle" /> Share button in Safari (bottom or top of the screen).
                        </li>
                        <li>
                            Scroll and tap <strong>“Add to Home Screen”</strong>.
                        </li>
                        <li>
                            Tap <strong>“Add”</strong> in the top right.
                        </li>
                    </ol>
                    <p className="text-xs">The app icon will appear on your home screen. Open it like any other app.</p>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
