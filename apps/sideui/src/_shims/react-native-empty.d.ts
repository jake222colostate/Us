declare module "react-native" {
  import * as React from "react";
  export const View: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const Text: React.FC<React.HTMLAttributes<HTMLSpanElement>>;
  export const Image: React.FC<React.ImgHTMLAttributes<HTMLImageElement>>;
  export const ScrollView: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const TouchableOpacity: React.FC<React.HTMLAttributes<HTMLButtonElement>>;
  export const Pressable: typeof TouchableOpacity;

  export const Platform: { OS: "ios" | "android" | "web" };
  export function useColorScheme(): "light" | "dark" | "no-preference";
  export const Appearance: { getColorScheme: () => "light" | "dark" | "no-preference" };

  export const StyleSheet: {
    create<T extends Record<string, React.CSSProperties>>(styles: T): T;
    flatten(input: any): React.CSSProperties;
  };

  export const Dimensions: { get(k: "window" | "screen"): { width: number; height: number; scale: number; fontScale: number } };
  export const PixelRatio: { get(): number };

  const _default: {};
  export default _default;
}
