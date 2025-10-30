declare module 'react-native' {
  export const View: any; export const Text: any; export const Image: any;
  export const Pressable: any; export const StyleSheet: any;
  export type ViewStyle = any; export type TextStyle = any;
  export interface TextProps { [k: string]: any }
  export function useColorScheme(): 'light' | 'dark' | null;
}
