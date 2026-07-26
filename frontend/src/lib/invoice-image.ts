import { toBlob } from "html-to-image";

export async function generateInvoiceImage(node: HTMLElement, pixelRatio = 3): Promise<Blob> {
    // Wait for web fonts so text doesn't fall back to system fonts in the capture
    if (document.fonts?.ready) await document.fonts.ready;

    const blob = await toBlob(node, {
        pixelRatio,
        cacheBust: true,
        backgroundColor: undefined,
    });

    if (!blob) throw new Error("Could not generate invoice");
    return blob;
}

export async function shareOrDownloadInvoiceImage(blob: Blob, filename: string, shareText: string) {
    const file = new File([blob], filename, { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
        return "shared" as const;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return "downloaded" as const;
}