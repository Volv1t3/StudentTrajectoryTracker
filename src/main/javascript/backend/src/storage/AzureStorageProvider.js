import AppError from '../utils/AppError.js';

export default class AzureStorageProvider {
  async upload() { throw new AppError('ERR_STORAGE_NOT_IMPLEMENTED', 'Azure storage not configured', 501); }
  async delete() { throw new AppError('ERR_STORAGE_NOT_IMPLEMENTED', 'Azure storage not configured', 501); }
  getPublicUrl() { throw new AppError('ERR_STORAGE_NOT_IMPLEMENTED', 'Azure storage not configured', 501); }
}
