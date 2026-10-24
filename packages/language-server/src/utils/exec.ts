import type { SpawnOptionsWithoutStdio } from 'node:child_process';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

export type CommandResult = { stdout: string, stderr: string, code: number | null };

export const exec = async (command: string, args: string[], options: SpawnOptionsWithoutStdio = {}): Promise<CommandResult> => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
        stdout += data;
    });
    child.stderr.on('data', (data) => {
        stderr += data;
    });

    // `close` is emitted with `child.exitCode` as its first argument.
    await once(child, 'close');

    return { stdout, stderr, code: child.exitCode };
};

export const isProcessError = (error: unknown): error is Error & CommandResult =>
    error instanceof Error && 'stderr' in error && 'stdout' in error;
