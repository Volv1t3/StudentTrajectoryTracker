import { supabase } from '../config/supabase.js';
import AppError from '../utils/AppError.js';

export default class SupabaseStorageProvider {
  async upload(bucket, path, buffer, mimetype) {
    const { error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType: mimetype, upsert: true });
    if (error) throw new AppError('ERR_STORAGE_UPLOAD', error.message, 500);
    return { publicUrl: this.getPublicUrl(bucket, path) };
  }

  async delete(bucket, path) {
    await supabase.storage.from(bucket).remove([path]);
  }

  getPublicUrl(bucket, path) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
}
