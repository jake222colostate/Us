export type PermissionStatus = 'granted' | 'denied' | 'undetermined';
export interface PermissionResponse {
  status: PermissionStatus;
  granted: boolean;
}
export interface Position {
  coords: {
    latitude: number;
    longitude: number;
    [key: string]: number;
  };
}
export const Accuracy: {
  Highest: number;
  [key: string]: number;
};
export function requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
export function getCurrentPositionAsync(options?: { accuracy?: number }): Promise<Position>;
