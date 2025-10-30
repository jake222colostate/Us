declare module "./components/Button" {
  import * as React from "react";
  export interface ButtonProps extends React.ComponentProps<"button"> { }
  const Button: React.FC<ButtonProps>;
  export default Button;
}

declare module "./components/Card" {
  import * as React from "react";
  export interface CardProps extends React.ComponentProps<"div"> { }
  const Card: React.FC<CardProps>;
  export default Card;
}

declare module "./components/Avatar" {
  import * as React from "react";
  export interface AvatarProps extends React.ComponentProps<"img"> { }
  const Avatar: React.FC<AvatarProps>;
  export default Avatar;
}

declare module "./components/Text" {
  import * as React from "react";
  export interface TextProps extends React.ComponentProps<"span"> { }
  const Text: React.FC<TextProps>;
  export default Text;
}

declare module "./theme" {
  export function useTheme(): "light" | "dark";
  export const __ui_runtime_anchor: boolean | undefined;
}
