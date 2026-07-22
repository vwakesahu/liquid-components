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
        background: "#080808",
        color: "#f7f7f8",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 1040,
          height: 470,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 72px",
          border: "1px solid rgba(255,255,255,.12)",
          background: "#0d0d0d",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 58,
              height: 40,
              display: "flex",
              border: "1px solid rgba(255,255,255,.38)",
              borderRadius: 999,
              background: "rgba(255,255,255,.08)",
              boxShadow: "inset 1px 1px 1px rgba(255,255,255,.3)",
            }}
          />
          <span style={{ fontSize: 29, fontWeight: 650, letterSpacing: -0.8 }}>
            {siteConfig.name}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontSize: 64, fontWeight: 680, letterSpacing: -3.2, lineHeight: 1.03 }}>
            Liquid Glass components
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 24,
              borderTop: "1px solid rgba(255,255,255,.1)",
              fontSize: 23,
              color: "rgba(247,247,248,.55)",
            }}
          >
            <span>React · shadcn/ui</span>
            <span>liquidcomponents.xyz</span>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
