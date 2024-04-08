import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';

type CommandResult = { stdout: string, stderr: string };

export const execPromisified = promisify(execCb);

export const isProcessError = (error: any): error is Error & CommandResult => {
    return error instanceof Error && 'stderr' in error && 'stdout' in error;
};

export const exec = (cmd: string): Promise<{ stdout: string, stderr: string }> => {
    return execPromisified(cmd).catch((err) => ({ stdout: '', stderr: err.message }))
};
