import * as React from "react";

/** Button */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
export const Button: React.FC<ButtonProps>;

/** Card */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export const Card: React.FC<CardProps>;

/** Avatar */
export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {}
export const Avatar: React.FC<AvatarProps>;

/** Text */
export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {}
export const Text: React.FC<TextProps>;

/** Theme hook */
export function useTheme(): "light" | "dark";
