export const PASSWORD_POLICY_HINT = 'Mínimo 12 caracteres, una mayúscula y dos números';
export const PASSWORD_POLICY_ERROR = 'La contraseña debe tener al menos 12 caracteres, 1 mayúscula y 2 números';

export function validatePasswordPolicy(password: string): string | null {
  if (!password || password.length < 12) {
    return PASSWORD_POLICY_ERROR;
  }

  if (!/[A-ZÁÉÍÓÚÑ]/.test(password)) {
    return PASSWORD_POLICY_ERROR;
  }

  const digitMatches = password.match(/\d/g) || [];
  if (digitMatches.length < 2) {
    return PASSWORD_POLICY_ERROR;
  }

  return null;
}
