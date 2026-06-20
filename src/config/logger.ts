import winston from 'winston';
import { env } from './env';
import { requestContext } from '../middlewares/requestContext.middleware';

const addRequestId = winston.format((info) => {
  const context = requestContext.getStore();
  if (context?.requestId) {
    info.requestId = context.requestId;
  }
  return info;
});

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  addRequestId(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'cartflow-service' },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'development'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : logFormat
    }),
  ],
});

export default logger;
