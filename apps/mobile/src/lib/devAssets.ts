import * as FileSystem from "expo-file-system";

let cached: string[] | null = null;

export async function loadDevManifest(): Promise<string[]> {
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const fsWithDir = FileSystem as typeof FileSystem & { documentDirectory?: string | null };
    const documentDir = typeof fsWithDir.documentDirectory === 'string' ? fsWithDir.documentDirectory : "";
    const manifestPath = `${documentDir}apps/mobile/assets/dev/manifest.json`;

    if (typeof window !== "undefined") {
      const res = await fetch("/apps/mobile/assets/dev/manifest.json");
      if (!res.ok) {
        cached = [];
        return cached ?? [];
      }
      const json = await res.json();
      cached = (json.files || []).map((f: string) => `/apps/mobile/assets/dev/${f}`);
      return cached ?? [];
    }

    const info = await FileSystem.getInfoAsync(manifestPath);
    if (!info.exists) {
      cached = [];
      return cached ?? [];
    }
    const content = await FileSystem.readAsStringAsync(manifestPath);
    const parsed = JSON.parse(content);
    cached = (parsed.files || []).map((f: string) => `${documentDir}apps/mobile/assets/dev/${f}`);
    return cached ?? [];
  } catch (error) {
    console.warn("loadDevManifest fallback", error);
    cached = [];
    return cached;
  }
}

export async function getDevAssetUri(index = 0): Promise<string | null> {
  const manifest = await loadDevManifest();
  if (!manifest.length) {
    return null;
  }
  return manifest[index % manifest.length];
}
