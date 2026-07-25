import { ApiIdentifierType } from "./api";

export function apiToUiIdentifierType(t: ApiIdentifierType): "tiktok" | "instagram" | "street" | "website" {
    switch (t) {
        case "TIKTOK":
            return "tiktok";
        case "INSTAGRAM":
            return "instagram";
        case "STREET":
            return "street";
        case "WEBSITE":
            return "website";
        default:
            return "instagram";
    }
}