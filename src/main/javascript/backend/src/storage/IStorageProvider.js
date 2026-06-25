/**
 * @interface IStorageProvider
 * @method upload(bucket: string, path: string, buffer: Buffer, mimetype: string) -> Promise<{publicUrl: string}>
 * @method delete(bucket: string, path: string) -> Promise<void>
 * @method getPublicUrl(bucket: string, path: string) -> string
 */
