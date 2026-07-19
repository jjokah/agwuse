import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CHURCH_INFO } from "@/lib/constants";

export const alt = `${CHURCH_INFO.shortName} - ${CHURCH_INFO.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "ag-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#14142b",
          backgroundImage:
            "radial-gradient(circle at 50% 120%, rgba(224,168,46,0.35), transparent 60%)",
        }}
      >
        <img src={logoSrc} alt="" width={140} height={140} />
        <div
          style={{
            marginTop: 40,
            fontSize: 72,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          {CHURCH_INFO.shortName}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 30,
            color: "#e0a82e",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
          }}
        >
          {CHURCH_INFO.tagline}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          {`${CHURCH_INFO.name} · Abuja`}
        </div>
      </div>
    ),
    { ...size }
  );
}
