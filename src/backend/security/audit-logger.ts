
import { adminFirestore } from '@/backend/shared/infrastructure/firebase/admin-app';

const AUDIT_COLLECTION = 'audit_logs';

export interface AuditLogEntry {
    action: string;
    userId: string;
    resourceId?: string;
    details?: any;
    status: 'success' | 'failure';
    ip?: string;
    metadata?: any;
}

export class AuditLogger {
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            await adminFirestore.collection(AUDIT_COLLECTION).add({
                ...entry,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Failed to write audit log:', error);
            // Fail open - logging shouldn't break the app flow
        }
    }
}

export const auditLogger = new AuditLogger();
