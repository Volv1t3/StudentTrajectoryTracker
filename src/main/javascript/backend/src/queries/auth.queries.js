import pool from '../config/db.js';

export const storeRefreshToken = async ({ userType, userId, tokenHash, expiresAt, userAgent, ipAddress }) => {
  await pool.execute('CALL sp_auth_store_refresh_token(?, ?, ?, ?, ?, ?, @p_token_id)', [userType, userId, tokenHash, expiresAt, userAgent, ipAddress]);
  const [[{ '@p_token_id': tokenId }]] = await pool.execute('SELECT @p_token_id');
  return tokenId;
};

export const findRefreshToken = async (tokenHash) => {
  const [rows] = await pool.execute('CALL sp_auth_validate_refresh_token(?)', [tokenHash]);
  return rows[0]?.[0] || null;
};

export const revokeToken = (tokenHash) => pool.execute('CALL sp_auth_revoke_token(?)', [tokenHash]);

export const revokeAllUserTokens = (userType, userId) => pool.execute('CALL sp_auth_revoke_all_user_tokens(?, ?)', [userType, userId]);

export const setPassword = (collaboratorId, passwordHash, ipAddress) => pool.execute('CALL sp_auth_set_password(?, ?, ?)', [collaboratorId, passwordHash, ipAddress]);

export const findAdminByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT * FROM administrators WHERE usfq_email COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci AND is_active = true',
    [email]
  );
  return rows[0] || null;
};

export const findAdminById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM administrators WHERE id = ? AND is_active = true',
    [id]
  );
  return rows[0] || null;
};

export const listActiveAdminEmails = async () => {
  const [rows] = await pool.execute(
    'SELECT usfq_email FROM administrators WHERE is_active = true AND usfq_email IS NOT NULL ORDER BY id ASC'
  );
  return rows.map((row) => row.usfq_email).filter(Boolean);
};

// Activation tokens - raw SQL
export const storeActivationToken = ({ collaboratorId, tokenHash, expiresAt }) =>
  pool.execute('INSERT INTO activation_tokens (collaborator_id, token_hash, expires_at) VALUES (?, ?, ?)', [collaboratorId, tokenHash, expiresAt]);

export const deletePendingActivationTokens = (collaboratorId) =>
  pool.execute('DELETE FROM activation_tokens WHERE collaborator_id = ? AND used_at IS NULL', [collaboratorId]);

export const findActivationToken = async (tokenHash) => {
  const [rows] = await pool.execute('SELECT * FROM activation_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()', [tokenHash]);
  return rows[0] || null;
};

export const markActivationTokenUsed = (tokenHash) =>
  pool.execute('UPDATE activation_tokens SET used_at = NOW() WHERE token_hash = ?', [tokenHash]);

// Password reset tokens - raw SQL
export const storeResetToken = ({ collaboratorId, tokenHash, expiresAt }) =>
  pool.execute('INSERT INTO password_reset_tokens (collaborator_id, token_hash, expires_at) VALUES (?, ?, ?)', [collaboratorId, tokenHash, expiresAt]);

export const findResetToken = async (tokenHash) => {
  const [rows] = await pool.execute('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()', [tokenHash]);
  return rows[0] || null;
};

export const markResetTokenUsed = (tokenHash) =>
  pool.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?', [tokenHash]);
