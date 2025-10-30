import React from "react";
import { normalizeStyle } from "./rn-style";

type Props = {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: React.CSSProperties | React.CSSProperties[];
  children?: React.ReactNode;
};
export default function LinearGradient({ colors, start, end, style, children }: Props) {
  const s = normalizeStyle(style as any) || {};
  const angle = (() => {
    const sx = start?.x ?? 0, sy = start?.y ?? 0, ex = end?.x ?? 0, ey = end?.y ?? 1;
    const dx = ex - sx, dy = ey - sy;
    const rad = Math.atan2(dy, dx);
    return (rad * 180) / Math.PI;
  })();
  const bg = `linear-gradient(${angle}deg, ${colors.join(", ")})`;
  return <div style={{ ...s, backgroundImage: bg }}>{children}</div>;
}
