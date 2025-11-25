import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { isTableMissingError, logTableMissingWarning } from './postgrestErrors';

export type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function fetchMessagesForMatch(matchId: string): Promise<MessageRow[]> {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data as MessageRow[] | null) ?? [];
  } catch (err) {
    const pgError = err as PostgrestError | null;
    if (pgError && isTableMissingError(pgError, 'messages')) {
      logTableMissingWarning('messages', pgError);
      return [];
    }
    throw err;
  }
}

export async function sendMessageForMatch(
  matchId: string,
  senderId: string,
  body: string,
): Promise<MessageRow> {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        body,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as MessageRow;
  } catch (err) {
    const pgError = err as PostgrestError | null;
    if (pgError && isTableMissingError(pgError, 'messages')) {
      logTableMissingWarning('messages', pgError);
    }
    throw err;
  }
}
