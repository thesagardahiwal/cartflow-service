import { EventEmitter } from 'events';
import { getRequestId } from '../middlewares/requestContext.middleware';

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners to prevent memory leak warnings if many listeners attach
    this.setMaxListeners(20);
  }

  emit(eventName: string | symbol, ...args: any[]): boolean {
    const reqId = getRequestId();
    if (reqId && args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      args[0] = { ...args[0], requestId: reqId };
    }
    return super.emit(eventName, ...args);
  }
}

export const eventBus = new EventBus();
