import { AuditLog, IAuditLog } from './models/AuditLog';

export class AuditLogRepository {
  async createLog(data: Partial<IAuditLog>): Promise<IAuditLog> {
    return AuditLog.create(data);
  }
}

export const auditLogRepository = new AuditLogRepository();
