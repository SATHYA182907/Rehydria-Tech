import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.legalName}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share image (brand typography over the forest panel). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #173F35 0%, #0F2E26 100%)",
          color: "#F6F7F4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#B8E4C9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0F2E26", fontSize: 34, fontWeight: 700 }}>R</div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>Rehydria Technology</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 600, lineHeight: 1, letterSpacing: -3 }}>Where Technology Meets Innovation.</div>
          <div style={{ fontSize: 28, color: "#B8C9BF" }}>{siteConfig.tagline}</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["IoT", "Arduino", "Hackathon Guide", "Verifiable certificates"].map((t) => (
            <div key={t} style={{ border: "1px solid rgba(184,228,201,0.35)", borderRadius: 999, padding: "10px 22px", fontSize: 22, color: "#B8E4C9" }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
