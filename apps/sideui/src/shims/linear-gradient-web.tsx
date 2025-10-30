import * as React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: React.CSSProperties;
};

export function LinearGradient({ colors = ["#000", "#000"], style, children, ...rest }: Props) {
  const backgroundImage = `linear-gradient(90deg, ${colors.join(",")})`;
  return (
    <div
      {...rest}
      style={{
        ...style,
        backgroundImage,
      }}
    >
      {children}
    </div>
  );
}
