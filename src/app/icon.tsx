import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px solid rgba(94, 234, 212, 0.5)",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            background: "#5eead4",
            transform: "rotate(45deg)",
          }}
        />
      </div>
    </div>,
    {
      ...size,
    },
  );
}
