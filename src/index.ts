import { runApplication } from './application';

runApplication(require('minimist')(process.argv.slice(2))).catch(() => process.exit(1));
