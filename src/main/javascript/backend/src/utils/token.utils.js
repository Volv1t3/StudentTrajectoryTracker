import { randomBytes, createHmac } from 'crypto';

export function generateHmacToken(secret) {
  const token = randomBytes(32).toString('hex');
  const hash = createHmac('sha256', secret).update(token).digest('hex');
  return { token, hash };
}

export function verifyHmacToken(rawToken, secret, storedHash) {
  const hash = createHmac('sha256', secret).update(rawToken).digest('hex');
  return hash === storedHash;
}
