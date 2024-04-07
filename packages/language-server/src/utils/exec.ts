import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';

export const execPromisified = promisify(execCb);

export const exec = (cmd: string): Promise<{ stdout: string, stderr: string }> => {
    return execPromisified(cmd).catch((err) => ({ stdout: '', stderr: err.message }))
};
