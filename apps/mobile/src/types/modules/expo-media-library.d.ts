export interface PermissionResponse {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
}
export function requestPermissionsAsync(): Promise<PermissionResponse>;
export function saveToLibraryAsync(uri: string): Promise<void>;
