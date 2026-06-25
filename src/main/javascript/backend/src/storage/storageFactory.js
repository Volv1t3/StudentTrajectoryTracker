import { env } from '../config/env.js';
import SupabaseStorageProvider from './SupabaseStorageProvider.js';
import AzureStorageProvider from './AzureStorageProvider.js';

let instance;

export function getStorage() {
  if (instance) return instance;
  switch (env.STORAGE_PROVIDER) {
    case 'supabase': instance = new SupabaseStorageProvider(); break;
    case 'azure': instance = new AzureStorageProvider(); break;
    default: throw new Error(`Unknown STORAGE_PROVIDER: ${env.STORAGE_PROVIDER}`);
  }
  return instance;
}
