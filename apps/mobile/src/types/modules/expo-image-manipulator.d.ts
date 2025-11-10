export type ManipulatorActions = any;
export type ManipulateOptions = Record<string, unknown>;
export const SaveFormat: {
  PNG: 'png';
  JPEG: 'jpeg';
  HEIC: 'heic';
  [key: string]: string;
};
export const FlipType: {
  Horizontal: 'horizontal';
  Vertical: 'vertical';
  [key: string]: string;
};
export function manipulateAsync(
  uri: string,
  actions?: ManipulatorActions,
  options?: ManipulateOptions,
): Promise<{ uri: string; width?: number; height?: number }>;
