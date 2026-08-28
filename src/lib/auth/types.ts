export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SALES'
  | 'FINANCE'
  | 'LOGISTICS'
  | 'SUPPORT'
  | 'DEALER';

export interface AuthSession {
  userId: string;
  dealerId: string;
  dealerCode: string;
  dealerName: string;
  email: string;
  role: UserRole;
  tier: 'Standart' | 'Silver' | 'Gold';
  discountRate: number;
  creditLimit: number;
  createdAt: string;
}

export interface SecurityContext {
  session: AuthSession;
  isAuthorized: boolean;
  canAccessResource: (resourceDealerId?: string | null) => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  dealerId: string;
  userRole: UserRole;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE_ORDER' | 'UPDATE_ORDER_STATUS' | 'CARI_MUTATION' | 'PRICE_CHANGE' | 'LIMIT_CHANGE' | 'WARRANTY_CLAIM' | 'DELETE_RESOURCE';
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
}
