import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners to prevent memory leak warnings if many listeners attach
    this.setMaxListeners(20);
  }
}

export const eventBus = new EventBus();
