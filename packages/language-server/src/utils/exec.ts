import { promisify } from 'node:util';

export const exec: (cmd: string) => Promise<{ stdout: string; stderr: string }> = promisify(require('node:child_process').exec);
