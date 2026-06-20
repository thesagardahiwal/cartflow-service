import { eventBus } from '../eventBus';
import { EVENTS } from '../eventTypes';
import { auditLogRepository } from '../../repositories/auditLog.repository';
import mongoose from 'mongoose';
import logger from '../../config/logger';

const handleAuditEvent = async (action: string, data: any) => {
  try {
    const { userId, entityId, ...payload } = data;
    await auditLogRepository.createLog({
      userId: userId ? userId.toString() : undefined,
      action,
      payload: { entityId, ...payload }
    });
  } catch (error) {
    logger.error(`Error saving audit log for ${action}`, { error });
  }
};

eventBus.on(EVENTS.ITEM_ADDED, (data) => handleAuditEvent('CART_ITEM_ADDED', data));
eventBus.on(EVENTS.ITEM_UPDATED, (data) => handleAuditEvent('CART_ITEM_UPDATED', data));
eventBus.on(EVENTS.ITEM_REMOVED, (data) => handleAuditEvent('CART_ITEM_REMOVED', data));
eventBus.on(EVENTS.CHECKOUT_COMPLETED, (data) => handleAuditEvent('CART_CHECKOUT', data));
eventBus.on(EVENTS.CART_EXPIRED, (data) => handleAuditEvent('CART_EXPIRED', data));
eventBus.on(EVENTS.PROMOTION_APPLIED, (data) => handleAuditEvent('PROMOTION_APPLIED', data));
