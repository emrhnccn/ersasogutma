import crypto from 'crypto';

export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates password against enterprise security policy:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number or special symbol
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Şifre en az 8 karakter uzunluğunda olmalıdır.'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Şifre en az bir büyük harf (A-Z) içermelidir.'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Şifre en az bir küçük harf (a-z) içermelidir.'
    };
  }

  if (!/[0-9\W_]/.test(password)) {
    return {
      isValid: false,
      message: 'Şifre en az bir rakam veya özel karakter içermelidir.'
    };
  }

  return { isValid: true };
}

/**
 * Hashes raw token with SHA-256 for secure DB storage
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generate cryptographically secure random token (64 hex characters)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * In-memory rate limiting for auth endpoints (prevents brute force)
 */
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.expiresAt < now) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}
