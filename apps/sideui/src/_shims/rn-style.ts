type Style = React.CSSProperties | undefined | null;
type MaybeArray<T> = T | T[] | null | undefined;

export function normalizeStyle(input: MaybeArray<Style>): React.CSSProperties | undefined {
  if (!input) return undefined;
  const arr = Array.isArray(input) ? input : [input];
  const out: React.CSSProperties = {};
  for (const s of arr) {
    if (!s) continue;
    for (const [k, v] of Object.entries(s)) {
      if (!Number.isNaN(Number(k))) continue; // drop numeric keys
      // @ts-ignore
      out[k] = v as any;
    }
  }
  return out;
}
