import pino from 'pino';
import { PrettyOptions } from 'pino-pretty';
import type { LokiOptions } from 'pino-loki';

const pinoLokiTransport = pino.transport<LokiOptions>({
  target: 'pino-loki',
  options: {
    host: 'http://localhost:3100',
    batching: false,
    labels: { application: 'tessera' },
  },
});

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
