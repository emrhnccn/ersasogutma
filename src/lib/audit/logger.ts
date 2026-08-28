import { AuditLogEntry, UserRole } from '../auth/types';

// In-memory audit log ring buffer (persists to console and ready for DB table)
const AUDIT_LOG_BUFFER: AuditLogEntry[] = [];
const MAX_LOGS = 500;

export function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const log: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };

  AUDIT_LOG_BUFFER.unshift(log);
  if (AUDIT_LOG_BUFFER.length > MAX_LOGS) {
    AUDIT_LOG_BUFFER.pop();
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUDIT] ${log.timestamp} | ${log.userRole} (${log.userId}) -> ${log.action} on ${log.resourceType}:`, log.details || '');
  }

  return log;
}

export function getRecentAuditLogs(limit = 50): AuditLogEntry[] {
  return AUDIT_LOG_BUFFER.slice(0, limit);
}
