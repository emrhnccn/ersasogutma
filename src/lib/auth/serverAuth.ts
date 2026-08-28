import { NextRequest } from 'next/server';
import { AuthSession, UserRole, SecurityContext } from './types';

// Default mock dealer session for development / demo mode
// Ready to be replaced by JWT / iron-session / NextAuth when real auth DB is plugged in
const DEFAULT_DEALER_SESSION: AuthSession = {
  userId: 'usr-ersa-01',
  dealerId: 'dealer-41008',
  dealerCode: 'BAYI-41008',
  dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.',
  email: 'info@ersasogutma.com.tr',
  role: 'DEALER',
  tier: 'Gold',
  discountRate: 0.40,
  creditLimit: 750000,
  createdAt: new Date().toISOString()
};

const ADMIN_SESSION: AuthSession = {
  userId: 'usr-admin-01',
  dealerId: 'dealer-admin-hq',
  dealerCode: 'ERSA-HQ',
  dealerName: 'ERSA SOĞUTMA YÖNETİM MERKEZİ',
  email: 'admin@ersasogutma.com.tr',
  role: 'ADMIN',
  tier: 'Gold',
  discountRate: 0.40,
  creditLimit: 9999999,
  createdAt: new Date().toISOString()
};

export async function getServerSession(req?: NextRequest): Promise<AuthSession> {
  // Check authorization header or cookie if present
  if (req) {
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-dealer-role');
    if (authHeader?.includes('ADMIN') || req.nextUrl.pathname.startsWith('/api/admin')) {
      return ADMIN_SESSION;
    }
  }
  return DEFAULT_DEALER_SESSION;
}

export async function validateSecurityContext(req?: NextRequest): Promise<SecurityContext> {
  const session = await getServerSession(req);

  const hasRole = (...roles: UserRole[]): boolean => {
    if (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN') return true;
    return roles.includes(session.role);
  };

  const canAccessResource = (resourceDealerId?: string | null): boolean => {
    // Admins and sales can view everything
    if (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN' || session.role === 'SALES' || session.role === 'FINANCE') {
      return true;
    }
    // Dealers can only access their own resources
    if (!resourceDealerId) return true;
    return session.dealerId === resourceDealerId || session.dealerCode === resourceDealerId;
  };

  return {
    session,
    isAuthorized: true,
    canAccessResource,
    hasRole
  };
}
