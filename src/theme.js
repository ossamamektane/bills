// The website's two palettes, as native colours.
import { createContext, useContext } from "react";

export const PALETTES = {
  light: {
    text: "#1D1D1F", muted: "#6E6E73", canvas: "#FFFFFF", surface: "#F1F1F3",
    surfaceStrong: "#E5E5E9", row: "#FFFFFF", sheet: "#FFFFFF", hairline: "#D2D2D7",
    accent: "#1D1D1F", onAccent: "#FFFFFF", line: "rgba(0,0,0,0.13)",
    press: "rgba(0,0,0,0.06)", scrim: "rgba(0,0,0,0.32)", toast: "#1D1D1F", onToast: "#FFFFFF",
  },
  dark: {
    text: "#F5F5F7", muted: "#A1A1A6", canvas: "#000000", surface: "#1D1D1F",
    surfaceStrong: "#2C2C2E", row: "#161617", sheet: "#1C1C1E", hairline: "#424245",
    accent: "#F5F5F7", onAccent: "#000000", line: "rgba(255,255,255,0.18)",
    press: "rgba(255,255,255,0.10)", scrim: "rgba(0,0,0,0.6)", toast: "#F5F5F7", onToast: "#000000",
  },
};

// Everything a component needs to draw itself: colours, language, direction.
export const UI = createContext(null);
export function useUI() { return useContext(UI); }

// Arabic mirrors the layout. Rows flip and text aligns to the right.
export function dirStyles(rtl) {
  return {
    row: rtl ? "row-reverse" : "row",
    align: rtl ? "right" : "left",
    alignEnd: rtl ? "left" : "right",
    selfStart: rtl ? "flex-end" : "flex-start",
    selfEnd: rtl ? "flex-start" : "flex-end",
  };
}
