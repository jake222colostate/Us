import * as React from "react";

type GradientProps = React.HTMLAttributes<HTMLDivElement> & {
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: React.CSSProperties;
};

export const LinearGradient: React.FC<GradientProps> = ({ colors, style, children, ...rest }) => {
  const backgroundImage =
    colors && colors.length ? `linear-gradient(90deg, ${colors.join(",")})` : undefined;
  return <div {...rest} style={{ ...style, backgroundImage }}>{children}</div>;
};

export default LinearGradient;
