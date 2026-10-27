import { ImageResponse } from "next/og";

// The default share image (Open Graph and Twitter), drawn here from the brand
// colours so there is no picture file to keep in step. One image for both
// languages, so it carries only the brand name. Built once, at build time.
export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "#f7f1ec",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -100,
          width: 460,
          height: 460,
          borderRadius: 460,
          background: "#e99392",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -140,
          right: -80,
          width: 520,
          height: 520,
          borderRadius: 520,
          background: "#b4c589",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 140,
          width: 150,
          height: 150,
          borderRadius: 150,
          background: "#dfcbe3",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ fontSize: 150, fontWeight: 700, color: "#383838", letterSpacing: -4 }}>Humraah</div>
        <div style={{ fontSize: 40, color: "#6b5f58" }}>Guidance for students in Pakistan</div>
      </div>
    </div>,
    size,
  );
}
