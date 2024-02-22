import os from 'os';
import path from 'path';
import piscina from 'piscina';

import { rootFolderPath } from '../config';

const Piscina = piscina.Piscina;

export function createPool(worker: string): piscina {
  return new Piscina({
    filename: path.join(rootFolderPath, `dist/workers/${worker}.worker.js`),
    maxThreads: getMaxThreads(),
  });
}

function getMaxThreads() {
  return 2 * os.cpus().length + 1;
}
