import { promisify } from 'node:util';
import { exec as execCb, ExecOptions } from 'node:child_process';

type CommandResult = { stdout: string, stderr: string };

const BYTES_5MB = 1024 * 1024 * 5;

export const execPromisified = async (command: string, options: ExecOptions = {}) => {
    return await promisify(execCb)(command, {
        ...options,
        maxBuffer: BYTES_5MB,
    });
};

export const isProcessError = (error: any): error is Error & CommandResult => {
    return error instanceof Error && 'stderr' in error && 'stdout' in error;
};
