import { ImageResponse } from "next/og";
import { siteConfig } from "../lib/site";

export const alt = "Liquid UI — Liquid Glass components for shadcn/ui";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#09090b",
        color: "#f7f7f8",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at 18% 12%, rgba(169,139,255,.32), transparent 36%), radial-gradient(circle at 86% 78%, rgba(105,215,255,.24), transparent 34%)",
        }}
      />
      <div
        style={{
          width: 1040,
          height: 470,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 72px",
          border: "1px solid rgba(255,255,255,.16)",
          background: "rgba(255,255,255,.045)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 82,
              height: 58,
              display: "flex",
              border: "2px solid rgba(255,255,255,.62)",
              borderRadius: 999,
              background:
                "radial-gradient(circle at 28% 24%, #fff, transparent 32%), linear-gradient(135deg, #a98bff, #69d7ff 55%, #72ffa8)",
              boxShadow: "0 14px 38px rgba(96,111,255,.34)",
            }}
          />
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
            {siteConfig.name}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 66, fontWeight: 760, letterSpacing: -3.5, lineHeight: 1 }}>
            Liquid Glass components
          </div>
          <div style={{ fontSize: 30, color: "rgba(247,247,248,.66)" }}>
            Open-code interaction primitives for React and shadcn/ui.
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
