import { supabase } from './supabase';

export async function runSupabaseSmokeTest(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.getSession();

    if (error) {
      console.warn(`[supabase] smoke test failed: ${error.message}`);
      return false;
    }

    console.log('[supabase] smoke test passed: auth session endpoint reachable');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[supabase] smoke test failed: ${message}`);
    return false;
  }
}
