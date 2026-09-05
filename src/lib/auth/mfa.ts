/**
 * Multi-Factor Authentication (MFA / 2FA) Infrastructure & Roadmap Config
 * Provides enterprise feature-flagging for Admin & Dealer security.
 */

export interface MfaConfig {
  enabled: boolean;
  requiredForAdmin: boolean;
  requiredForDealers: boolean;
  allowedMethods: Array<'TOTP' | 'SMS' | 'EMAIL'>;
}

export const MFA_CONFIG: MfaConfig = {
  enabled: process.env.ENABLE_MFA === 'true',
  requiredForAdmin: process.env.REQUIRE_ADMIN_MFA === 'true',
  requiredForDealers: false,
  allowedMethods: ['TOTP', 'EMAIL']
};

/**
 * Checks if MFA is required for a specific role
 */
export function isMfaRequired(role: string): boolean {
  if (!MFA_CONFIG.enabled) return false;
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return MFA_CONFIG.requiredForAdmin;
  }
  return MFA_CONFIG.requiredForDealers;
}

/**
 * Placeholder for TOTP verification (can be wired to otplib / speakeasy)
 */
export async function verifyTotpToken(userId: string, token: string): Promise<boolean> {
  // If MFA is disabled in current environment, accept
  if (!MFA_CONFIG.enabled) return true;
  if (!token || token.length !== 6) return false;
  // Production integration with TOTP secret verification
  return true;
}
