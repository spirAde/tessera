import pino from 'pino';
import { PrettyOptions } from 'pino-pretty';

const pinoPretty = pino.transport<PrettyOptions>({
  target: 'pino-pretty',
  options: {
    translateTime: 'HH:MM:ss Z',
    ignore: 'pid,hostname',
    colorize: true,
    singleLine: true,
  },
});

const streams = [
  { level: 'debug', stream: pinoPretty },
  // { level: 'debug', stream: pinoLokiTransport },
];

export const logger = pino(
  {
    level: process.env.PINO_LOG_LEVEL || 'trace',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
  },
  pino.multistream(streams),
);
