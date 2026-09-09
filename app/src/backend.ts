import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Mirrors website/assets/js/supabase-client.js: no keys are baked in.
// Whoever runs this app connects their own free Supabase project, the
// same one their website deployment uses (see ../../SETUP.md).
const STORAGE_KEY = 'sourcedlondon_backend_config';

export type BackendConfig = { url: string; anonKey: string };

let cachedClient: SupabaseClient | null = null;
let cachedConfig: BackendConfig | null = null;

export async function getBackendConfig(): Promise<BackendConfig | null> {
  if (cachedConfig) return cachedConfig;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    cachedConfig = JSON.parse(raw);
    return cachedConfig;
  } catch {
    return null;
  }
}

export async function setBackendConfig(config: BackendConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  cachedConfig = config;
  cachedClient = null;
}

export async function clearBackendConfig(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  cachedConfig = null;
  cachedClient = null;
}

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;
  const config = await getBackendConfig();
  if (!config) return null;
  cachedClient = createClient(config.url, config.anonKey, {
    auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  return cachedClient;
}

// Live-tests a URL/key pair before it's saved, same as the admin.html setup wizard.
export async function testBackendConnection(config: BackendConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = createClient(config.url, config.anonKey);
    const { error } = await client.from('vehicles').select('id', { count: 'exact', head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not reach that Supabase project — check the URL.' };
  }
}
