export const TOKENS = {
    backdrop: "#3B1220",
    paper: "#F6EFE2",
    ink: "#221F1A",
    inkSoft: "#7A6E5D",
    gold: "#B8935A",
    goldLine: "#DCC9A0",
    stampRed: "#9B2C2C",
};

export function barcodeWidths(seed: string, count = 46) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return Array.from({ length: count }, () => {
        hash = (hash * 1103515245 + 12345) >>> 0;
        return 1 + (hash % 4);
    });
}

export function TornEdge({ flip = false }: { flip?: boolean }) {
    const d =
        "M0,24 L0,10 L20,18 L38,4 L55,14 L72,2 L90,16 L108,6 L125,20 L143,8 " +
        "L160,17 L178,3 L195,15 L213,5 L230,19 L248,9 L265,16 L283,2 L300,14 " +
        "L318,6 L335,20 L353,10 L370,18 L388,4 L400,12 L400,24 Z";
    return (
        <svg viewBox="0 0 400 24" preserveAspectRatio="none" className="w-full h-3 block" style={{ transform: flip ? "scaleY(-1)" : undefined }}>
            <path d={d} fill={TOKENS.paper} />
        </svg>
    );
}

export function StampBadge({ label = "BALANCE DUE" }: { label?: string }) {
    return (
        <div
            className="absolute select-none pointer-events-none"
            style={{
                top: 20,
                right: 20,
                transform: "rotate(-8deg)",
                border: `2px solid ${TOKENS.stampRed}`,
                borderRadius: 6,
                padding: "5px 12px",
                color: TOKENS.stampRed,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.12em",
                fontWeight: 700,
                opacity: 0.85,
            }}
        >
            {label}
        </div>
    );
}