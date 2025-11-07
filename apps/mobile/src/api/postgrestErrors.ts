import type { PostgrestError } from '@supabase/supabase-js';

function normalise(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

export function isTableMissingError(error: unknown, tableName?: string): boolean {
  if (!error) return false;
  const candidate = error as Partial<PostgrestError>;
  if (candidate.code !== 'PGRST205') {
    return false;
  }
  if (!tableName) {
    return true;
  }
  const lowerTable = tableName.toLowerCase();
  const message = normalise(candidate.message);
  const details = normalise(candidate.details);
  const hint = normalise(candidate.hint);
  return message.includes(lowerTable) || details.includes(lowerTable) || hint.includes(lowerTable);
}

export function logTableMissingWarning(tableName: string, error: unknown) {
  if (!isTableMissingError(error, tableName)) {
    return;
  }
  const formattedTable = tableName.includes('.') ? tableName : `public.${tableName}`;
  console.warn(
    `Supabase table ${formattedTable} is not available. Falling back to local data.`,
    error,
  );
}
