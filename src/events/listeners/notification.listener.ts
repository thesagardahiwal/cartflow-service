import { eventBus } from '../eventBus';
import { EVENTS } from '../eventTypes';
import logger from '../../config/logger';

eventBus.on(EVENTS.CHECKOUT_COMPLETED, (data) => {
  logger.info(`[Notification] Checkout complete email triggered for user ${data.userId}`);
  // In a real system, send email via SendGrid, AWS SES, etc.
});

eventBus.on(EVENTS.CART_EXPIRED, (data) => {
  logger.info(`[Notification] Cart expired push notification triggered for user ${data.userId}`);
});
